exports.version = 1;

exports.up = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  employee_code TEXT,
  hourly_rate REAL NOT NULL,
  id_number TEXT,
  active INTEGER DEFAULT 1,
  email TEXT
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  registration_number TEXT,
  address TEXT,
  contact_email TEXT,
  contact_number TEXT,
  logo_path TEXT,
  signature_image TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_pass TEXT,
  smtp_from TEXT,
  smtp_secure INTEGER
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
  rate_used REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deductions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payroll_line_id INTEGER,
  description TEXT,
  amount REAL
);
`;

exports.down = `
DROP TABLE IF EXISTS deductions;
DROP TABLE IF EXISTS payroll_lines;
DROP TABLE IF EXISTS pay_runs;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS employees;
`;