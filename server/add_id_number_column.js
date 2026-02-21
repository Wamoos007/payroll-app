const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./payroll.db");

db.run(
  "ALTER TABLE employees ADD COLUMN id_number TEXT",
  (err) => {
    if (err) {
      if (err.message.includes("duplicate column")) {
        console.log("Column id_number already exists. Nothing to do.");
      } else {
        console.error("Error adding id_number column:", err.message);
      }
    } else {
      console.log("Column id_number added successfully.");
    }
    db.close();
  }
);
