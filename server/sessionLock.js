const os = require("os");
const crypto = require("crypto");
const db = require("./db");

const LOCK_ID = 1;
const HEARTBEAT_INTERVAL_MS = 15000;
const STALE_AFTER_MS = 45000;

const sessionId = crypto.randomUUID();
const machineName = os.hostname();
const username = os.userInfo().username;
const holderName = `${username}@${machineName}`;

let heartbeatTimer = null;
let writeAccess = false;
let releaseHooksRegistered = false;
let currentAppVersion = "unknown";

function nowIso() {
  return new Date().toISOString();
}

function parseTimestamp(value) {
  const timestamp = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isLockStale(lockRow) {
  const heartbeat = parseTimestamp(lockRow?.heartbeat_at);
  return !heartbeat || (Date.now() - heartbeat) > STALE_AFTER_MS;
}

function normalizeLockRow(lockRow) {
  if (!lockRow || !lockRow.session_id) {
    return null;
  }

  return {
    sessionId: lockRow.session_id,
    holderName: lockRow.holder_name,
    machineName: lockRow.machine_name,
    username: lockRow.username,
    appVersion: lockRow.app_version,
    acquiredAt: lockRow.acquired_at,
    heartbeatAt: lockRow.heartbeat_at,
    stale: isLockStale(lockRow)
  };
}

function readRawLock() {
  return db.prepare(`
    SELECT session_id, holder_name, machine_name, username, app_version, acquired_at, heartbeat_at
    FROM session_lock
    WHERE id = ?
  `).get(LOCK_ID);
}

const claimLock = db.transaction((appVersion) => {
  const existing = readRawLock();

  if (existing?.session_id && existing.session_id !== sessionId && !isLockStale(existing)) {
    return {
      accessMode: "read",
      lock: normalizeLockRow(existing)
    };
  }

  if (existing?.session_id === sessionId) {
    db.prepare(`
      UPDATE session_lock
      SET heartbeat_at = ?,
          app_version = ?
      WHERE id = ?
        AND session_id = ?
    `).run(nowIso(), appVersion, LOCK_ID, sessionId);

    return {
      accessMode: "write",
      lock: normalizeLockRow(readRawLock())
    };
  }

  const timestamp = nowIso();

  db.prepare(`
    INSERT INTO session_lock (
      id,
      session_id,
      holder_name,
      machine_name,
      username,
      app_version,
      acquired_at,
      heartbeat_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      session_id = excluded.session_id,
      holder_name = excluded.holder_name,
      machine_name = excluded.machine_name,
      username = excluded.username,
      app_version = excluded.app_version,
      acquired_at = excluded.acquired_at,
      heartbeat_at = excluded.heartbeat_at
  `).run(
    LOCK_ID,
    sessionId,
    holderName,
    machineName,
    username,
    appVersion,
    timestamp,
    timestamp
  );

  return {
    accessMode: "write",
    lock: normalizeLockRow(readRawLock())
  };
});

function sendHeartbeat() {
  if (!writeAccess) {
    return;
  }

  try {
    db.prepare(`
      UPDATE session_lock
      SET heartbeat_at = ?
      WHERE id = ?
        AND session_id = ?
    `).run(nowIso(), LOCK_ID, sessionId);
  } catch (err) {
    console.error("Session heartbeat failed:", err);
  }
}

function startHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

  if (typeof heartbeatTimer.unref === "function") {
    heartbeatTimer.unref();
  }
}

function stopHeartbeat() {
  if (!heartbeatTimer) {
    return;
  }

  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function releaseLock() {
  stopHeartbeat();

  if (!writeAccess) {
    return;
  }

  try {
    db.prepare(`
      UPDATE session_lock
      SET session_id = NULL,
          holder_name = NULL,
          machine_name = NULL,
          username = NULL,
          app_version = NULL,
          acquired_at = NULL,
          heartbeat_at = NULL
      WHERE id = ?
        AND session_id = ?
    `).run(LOCK_ID, sessionId);
  } catch (err) {
    console.error("Failed to release session lock:", err);
  } finally {
    writeAccess = false;
  }
}

function registerReleaseHooks() {
  if (releaseHooksRegistered) {
    return;
  }

  releaseHooksRegistered = true;

  process.once("exit", releaseLock);
  process.once("SIGINT", () => {
    releaseLock();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    releaseLock();
    process.exit(0);
  });
}

function initializeSessionLock(appVersion) {
  currentAppVersion = appVersion;
  const result = claimLock(appVersion);

  writeAccess = result.accessMode === "write";

  if (writeAccess) {
    sendHeartbeat();
    startHeartbeat();
    registerReleaseHooks();
  } else {
    stopHeartbeat();
  }

  return getSessionStatus();
}

function refreshSessionLock() {
  const result = claimLock(currentAppVersion);

  writeAccess = result.accessMode === "write";

  if (writeAccess) {
    sendHeartbeat();
    startHeartbeat();
    registerReleaseHooks();
  } else {
    stopHeartbeat();
  }

  return getSessionStatus();
}

function hasWriteAccess() {
  return writeAccess;
}

function getSessionStatus() {
  const lock = normalizeLockRow(readRawLock());

  return {
    accessMode: writeAccess ? "write" : "read",
    currentSession: {
      sessionId,
      holderName,
      machineName,
      username
    },
    lockOwner: lock,
    canEdit: writeAccess
  };
}

function getWriteLockError() {
  return {
    error: "This database is currently in read-only mode on this computer.",
    message: "Another AMIEM Payroll session already has edit access. You can keep viewing data and exporting reports, but only the active editor can make changes.",
    session: getSessionStatus()
  };
}

module.exports = {
  getSessionStatus,
  getWriteLockError,
  hasWriteAccess,
  initializeSessionLock,
  refreshSessionLock,
  releaseLock
};
