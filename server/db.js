const Database = require("better-sqlite3");
const path = require("path");
const { migrate } = require("@blackglory/better-sqlite3-migrations");
const fs = require("fs");
const os = require("os");

/* ---------------------------
   RESOLVE DATABASE PATH
---------------------------- */

// Use Electron userData path if available
const appDataPath =
  process.env.USER_DATA_PATH ||
  path.join(os.homedir(), "AppData", "Roaming", "payroll-app");

// Ensure directory exists
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

const dbPath = path.join(appDataPath, "payroll.db");

console.log("Using database at:", dbPath);

/* ---------------------------
   OPEN DATABASE
---------------------------- */

const db = new Database(dbPath);

/* ---------------------------
   RUN MIGRATIONS
---------------------------- */

const migrationsDir = path.join(__dirname, "migrations");

if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith(".js"))
    .map(f => require(path.join(migrationsDir, f)));

  migrate(db, migrationFiles);
}

/* ---------------------------
   SAFETY SETTINGS TABLE
---------------------------- */

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

db.exec(`
  INSERT OR IGNORE INTO settings (key, value) VALUES
  ('enable_paye', '1'),
  ('enable_uif', '1'),
  ('dark_mode', '0');
`);

/* ---------------------------
   SHOW CURRENT SCHEMA VERSION
---------------------------- */

const currentVersion = db.pragma("user_version", { simple: true });
console.log("Database schema version:", currentVersion);

module.exports = db;