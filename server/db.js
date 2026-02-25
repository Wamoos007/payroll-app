const Database = require("better-sqlite3");
const path = require("path");
const { migrate } = require("@blackglory/better-sqlite3-migrations");
const fs = require("fs");
const os = require("os");

// Always use AppData location (even in dev)
const appDataPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "payroll-app"
);

// Create folder if it doesn't exist
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

const dbPath = path.join(appDataPath, "payroll.db");

console.log("Using database at:", dbPath);

// Open DB
const db = new Database(dbPath);

// Load migration files
const migrationsDir = path.join(__dirname, "migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter(f => f.endsWith(".js"))
  .map(f => require(path.join(migrationsDir, f)));

// Run migrations
migrate(db, migrationFiles);

// Ensure settings table exists (safety check)
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


// Show current database schema version
const currentVersion = db.pragma("user_version", { simple: true });
console.log("Database schema version:", currentVersion);

module.exports = db;