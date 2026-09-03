const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const fs = require("fs");
const path = require("path");
const { getUploadsPath } = require("../paths");
const { calculateTax } = require("../payrollCalc");

/* ===============================
   SYNC AN EMPLOYEE'S RATE INTO
   THEIR NOT-YET-PAID PAY RUN LINES
   (rate + PAYE, so both the rate
   and the tax on it stay correct)

   Only pay runs whose pay date is
   today or in the future are
   touched - anything already paid
   keeps the rate it was actually
   run at, so historical payslips
   never silently change.
================================ */
function syncRateToPayrollLines(employeeId, rate) {
  const settingsRows = db.prepare("SELECT key, value FROM settings").all();
  const settings = {};
  settingsRows.forEach(row => {
    settings[row.key] = row.value;
  });

  const lines = db.prepare(`
    SELECT pl.id, pl.hours_wk1, pl.hours_wk2, pl.ot15_hours, pl.ot20_hours, pr.tax_year_id
    FROM payroll_lines pl
    JOIN pay_runs pr ON pl.pay_run_id = pr.id
    WHERE pl.employee_id = ?
      AND pr.pay_date >= date('now', 'localtime')
  `).all(employeeId);

  const updateLine = db.prepare(`
    UPDATE payroll_lines
    SET rate_used = ?, tax_amount = ?
    WHERE id = ?
  `);

  lines.forEach(line => {
    const normalHours = Number(line.hours_wk1 || 0) + Number(line.hours_wk2 || 0);
    const ot15 = Number(line.ot15_hours || 0);
    const ot20 = Number(line.ot20_hours || 0);

    const gross =
      (normalHours * rate) +
      (ot15 * rate * 1.5) +
      (ot20 * rate * 2);

    let tax = 0;
    if (settings.enable_paye === "1" && line.tax_year_id) {
      tax = calculateTax(gross, line.tax_year_id);
    }

    updateLine.run(rate, tax, line.id);
  });
}

const uploadDir = getUploadsPath();

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

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
    if (!full_name || !employee_code || hourly_rate === undefined || hourly_rate === "") {
      return res.status(400).json({
        error: "Full name, employee code, and hourly rate are required."
      });
    }

    const numericRate = Number(hourly_rate);
    if (Number.isNaN(numericRate) || numericRate < 0) {
      return res.status(400).json({
        error: "Hourly rate must be a valid positive number."
      });
    }

    const result = db.prepare(`
      INSERT INTO employees
      (full_name, employee_code, id_number, hourly_rate, email, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      full_name.trim(),
      employee_code.trim(),
      id_number?.trim() || "",
      numericRate,
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
    if (!full_name || !employee_code || hourly_rate === undefined || hourly_rate === "") {
      return res.status(400).json({
        error: "Full name, employee code, and hourly rate are required."
      });
    }

    const numericRate = Number(hourly_rate);
    if (Number.isNaN(numericRate) || numericRate < 0) {
      return res.status(400).json({
        error: "Hourly rate must be a valid positive number."
      });
    }

    const applyUpdate = db.transaction(() => {
      db.prepare(`
        UPDATE employees
        SET full_name = ?,
            employee_code = ?,
            id_number = ?,
            hourly_rate = ?,
            email = ?
        WHERE id = ?
      `).run(
        full_name.trim(),
        employee_code.trim(),
        id_number?.trim() || "",
        numericRate,
        email || null,
        id
      );

      // Push the new rate (and recalculated PAYE) onto this employee's
      // not-yet-paid pay runs. Already-paid runs are left untouched so
      // past payslips keep showing the rate that was actually used.
      syncRateToPayrollLines(Number(id), numericRate);
    });

    applyUpdate();

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
