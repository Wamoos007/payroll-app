exports.version = 8;

exports.up = `
CREATE TABLE IF NOT EXISTS session_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  session_id TEXT,
  holder_name TEXT,
  machine_name TEXT,
  username TEXT,
  app_version TEXT,
  acquired_at TEXT,
  heartbeat_at TEXT
);

INSERT OR IGNORE INTO session_lock (
  id,
  session_id,
  holder_name,
  machine_name,
  username,
  app_version,
  acquired_at,
  heartbeat_at
)
VALUES (1, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
`;

exports.down = `
DROP TABLE IF EXISTS session_lock;
`;
