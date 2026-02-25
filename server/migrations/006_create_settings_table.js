module.exports = {
  version: 6,
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      INSERT OR IGNORE INTO settings (key, value) VALUES
      ('enable_paye', '1'),
      ('enable_uif', '1'),
      ('dark_mode', '0');
    `);
  },

  down: (db) => {
    db.exec(`
      DROP TABLE IF EXISTS settings;
    `);
  }
};