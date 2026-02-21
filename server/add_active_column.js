const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./payroll.db");

db.run(
  "ALTER TABLE employees ADD COLUMN active INTEGER DEFAULT 1",
  (err) => {
    if (err) {
      if (err.message.includes("duplicate column")) {
        console.log("Column already exists. Nothing to do.");
      } else {
        console.error("Error adding column:", err.message);
      }
    } else {
      console.log("Column 'active' added successfully.");
    }
    db.close();
  }
);
