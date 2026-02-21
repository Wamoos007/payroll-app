const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DB_PATH
  ? process.env.DB_PATH
  : path.join(__dirname, "payroll.db");

console.log("📦 Using database at:", dbPath);

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    employee_code TEXT,
    hourly_rate REAL NOT NULL,
    id_number TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    registration_number TEXT,
    address TEXT,
    contact_email TEXT,
    contact_number TEXT,
    logo_path TEXT,
    signature_image TEXT
  );

  

  CREATE TABLE IF NOT EXISTS pay_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_start TEXT,
    period_end TEXT,
    pay_date TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payroll_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pay_run_id INTEGER,
    employee_id INTEGER,
    hours_wk1 REAL DEFAULT 0,
    hours_wk2 REAL DEFAULT 0,
    ot15_hours REAL DEFAULT 0,
    ot20_hours REAL DEFAULT 0,
    rate_used REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_line_id INTEGER,
    description TEXT,
    amount REAL
  );
`);

// Ensure registration_number column exists (safe migration)
try {
  db.prepare(`SELECT registration_number FROM company LIMIT 1`).get();
} catch (err) {
  console.log("Adding registration_number column...");
  db.exec(`ALTER TABLE company ADD COLUMN registration_number TEXT`);
}

module.exports = db;