const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const fs = require("fs");
const path = require("path");

const upload = multer({
  dest: path.join(__dirname, "../uploads")
});

/* GET ALL */
router.get("/", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM employees
      ORDER BY employee_code ASC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

/* CREATE */
router.post("/", (req, res) => {
  const { full_name, employee_code, id_number, hourly_rate, email } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO employees
      (full_name, employee_code, id_number, hourly_rate, email, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      full_name,
      employee_code,
      id_number,
      hourly_rate,
      email || null
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

/* UPDATE */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { full_name, employee_code, id_number, hourly_rate, email } = req.body;

  try {
    db.prepare(`
      UPDATE employees
      SET full_name = ?,
          employee_code = ?,
          id_number = ?,
          hourly_rate = ?,
          email = ?
      WHERE id = ?
    `).run(
      full_name,
      employee_code,
      id_number,
      hourly_rate,
      email || null,
      id
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* DEACTIVATE */
router.post("/:id/deactivate", (req, res) => {
  try {
    db.prepare(`
      UPDATE employees SET active = 0 WHERE id = ?
    `).run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Deactivate failed" });
  }
});

/* REACTIVATE */
router.post("/:id/reactivate", (req, res) => {
  try {
    db.prepare(`
      UPDATE employees SET active = 1 WHERE id = ?
    `).run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Reactivate failed" });
  }
});

/* CSV IMPORT */
router.post("/import", upload.single("file"), (req, res) => {
  try {
    const fileContent = fs.readFileSync(req.file.path);

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    const stmt = db.prepare(`
      INSERT INTO employees
      (full_name, employee_code, id_number, hourly_rate, email, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    for (const row of records) {
      if (!row.full_name || !row.employee_code) {
        skipped++;
        continue;
      }

      try {
        stmt.run(
          row.full_name,
          row.employee_code,
          row.id_number || "",
          Number(row.hourly_rate || 0),
          row.email || ""
        );
        inserted++;
      } catch (err) {
        errors.push({
          employee_code: row.employee_code,
          error: err.message
        });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({ success: true, inserted, skipped, errors });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Import failed" });
  }
});

module.exports = router;