exports.version = 3;

exports.up = `
PRAGMA foreign_keys = OFF;

-- 1️⃣ Create tax_years table
CREATE TABLE IF NOT EXISTS tax_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  primary_rebate REAL DEFAULT 0,
  secondary_rebate REAL DEFAULT 0,
  tertiary_rebate REAL DEFAULT 0,
  locked INTEGER DEFAULT 0
);

-- 2️⃣ Create tax_brackets table
CREATE TABLE IF NOT EXISTS tax_brackets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_year_id INTEGER NOT NULL,
  min_income REAL NOT NULL,
  max_income REAL,
  base_tax REAL NOT NULL,
  marginal_rate REAL NOT NULL,
  FOREIGN KEY (tax_year_id) REFERENCES tax_years(id) ON DELETE CASCADE
);

-- 3️⃣ Add tax_year_id to pay_runs
ALTER TABLE pay_runs ADD COLUMN tax_year_id INTEGER;

PRAGMA foreign_keys = ON;
`;

exports.down = `
DROP TABLE IF EXISTS tax_brackets;
DROP TABLE IF EXISTS tax_years;
`;