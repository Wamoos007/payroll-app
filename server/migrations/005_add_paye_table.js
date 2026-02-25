module.exports = {
  version: 5,
  up: db => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS paye_tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tax_year_id INTEGER NOT NULL,
        income_from REAL NOT NULL,
        income_to REAL NOT NULL,
        annual_equivalent REAL NOT NULL,
        tax_amount REAL NOT NULL,
        FOREIGN KEY (tax_year_id) REFERENCES tax_years(id)
      );
    `);
  }
};