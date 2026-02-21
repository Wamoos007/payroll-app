CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT UNIQUE,
  full_name TEXT,
  id_number TEXT,
  hourly_rate REAL,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pay_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_start TEXT,
  period_end TEXT,
  pay_date TEXT,
  pay_year INTEGER,
  status TEXT DEFAULT 'DRAFT'
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
  FOREIGN KEY(pay_run_id) REFERENCES pay_runs(id),
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT,
  address TEXT,
  registration_number TEXT,
  contact_email TEXT,
  contact_number TEXT,
  logo_path TEXT,
  signature_image TEXT
);
CREATE TABLE IF NOT EXISTS payslip_deductions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payroll_line_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_line_id) REFERENCES payroll_lines(id)
);
CREATE TABLE IF NOT EXISTS locked_years (
  year INTEGER PRIMARY KEY
);
