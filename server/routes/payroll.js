const express = require("express");
const router = express.Router();
const db = require("../db");

/* ===============================
   GET RUNS
================================ */
router.get("/runs", (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT * FROM pay_runs ORDER BY pay_date DESC"
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* ===============================
   CREATE RUN
================================ */
router.post("/runs", (req, res) => {
  const { period_start, period_end, pay_date } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO pay_runs (period_start, period_end, pay_date, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(period_start, period_end, pay_date);

    const runId = result.lastInsertRowid;

    const employees = db.prepare(`
      SELECT id, hourly_rate
      FROM employees
      WHERE active = 1
    `).all();

    const insert = db.prepare(`
      INSERT INTO payroll_lines (pay_run_id, employee_id, rate_used)
      VALUES (?, ?, ?)
    `);

    employees.forEach(emp => {
      insert.run(runId, emp.id, emp.hourly_rate);
    });

    res.json({ id: runId });
  } catch (err) {
    res.status(500).json({ error: "Create failed" });
  }
});

/* ===============================
   ADD MISSING EMPLOYEES TO RUN
================================ */
router.post("/runs/:runId/add-missing", (req, res) => {
  const { runId } = req.params;

  try {
    const missingEmployees = db.prepare(`
      SELECT e.id, e.hourly_rate
      FROM employees e
      WHERE e.active = 1
      AND e.id NOT IN (
        SELECT employee_id
        FROM payroll_lines
        WHERE pay_run_id = ?
      )
    `).all(runId);

    const insert = db.prepare(`
      INSERT INTO payroll_lines (pay_run_id, employee_id, rate_used)
      VALUES (?, ?, ?)
    `);

    missingEmployees.forEach(emp => {
      insert.run(runId, emp.id, emp.hourly_rate);
    });

    res.json({
      added: missingEmployees.length
    });

  } catch (err) {
    console.error("Add missing error:", err);
    res.status(500).json({ error: "Failed to add employees" });
  }
});

/* ===============================
   GET LINES
================================ */
router.get("/lines/:runId", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT pl.*, e.full_name, e.employee_code
      FROM payroll_lines pl
      JOIN employees e ON pl.employee_id = e.id
      WHERE pl.pay_run_id = ?
      ORDER BY e.employee_code ASC
    `).all(req.params.runId);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Load failed" });
  }
});

/* ===============================
   YTD SUMMARY (Dashboard)
================================ */
router.get("/ytd-summary/:year", (req, res) => {
  const { year } = req.params;

  try {
    const rows = db.prepare(`
      SELECT 
        SUM(
          (
            COALESCE(pl.hours_wk1,0) +
            COALESCE(pl.hours_wk2,0)
          ) * COALESCE(pl.rate_used,0)
          +
          COALESCE(pl.ot15_hours,0) * COALESCE(pl.rate_used,0) * 1.5
          +
          COALESCE(pl.ot20_hours,0) * COALESCE(pl.rate_used,0) * 2
        ) AS totalGross
      FROM payroll_lines pl
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE strftime('%Y', pr.pay_date) = ?
    `).get(year);

    const gross = Number(rows.totalGross || 0);
    const uif = gross * 0.01;
    const net = gross - uif;

    res.json({
      totalGross: gross,
      totalUif: uif,
      totalNet: net
    });

  } catch (err) {
    console.error("YTD summary error:", err);
    res.status(500).json({ error: "YTD failed" });
  }
});

/* ===============================
   MONTHLY SUMMARY
================================ */
router.get("/monthly-summary/:year", (req, res) => {
  const { year } = req.params;

  try {
    const rows = db.prepare(`
      SELECT 
        strftime('%m', pr.pay_date) AS month,
        SUM(
          (
            COALESCE(pl.hours_wk1,0) +
            COALESCE(pl.hours_wk2,0)
          ) * COALESCE(pl.rate_used,0)
          +
          COALESCE(pl.ot15_hours,0) * COALESCE(pl.rate_used,0) * 1.5
          +
          COALESCE(pl.ot20_hours,0) * COALESCE(pl.rate_used,0) * 2
        ) AS totalGross
      FROM payroll_lines pl
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE strftime('%Y', pr.pay_date) = ?
      GROUP BY month
    `).all(year);

    res.json(rows);

  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ error: "Monthly failed" });
  }
});

/* ===============================
   UPDATE LINE
================================ */
router.put("/lines/:id", (req, res) => {
  const { id } = req.params;
  const { hours_wk1, hours_wk2, ot15_hours, ot20_hours } = req.body;

  try {
    db.prepare(`
      UPDATE payroll_lines
      SET hours_wk1 = ?, hours_wk2 = ?, ot15_hours = ?, ot20_hours = ?
      WHERE id = ?
    `).run(hours_wk1, hours_wk2, ot15_hours, ot20_hours, id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

/* ===============================
   GET DATA FOR PAYSLIP
================================ */
router.get("/lines/forPayslip/:id", (req, res) => {
  const { id } = req.params;

  try {
    const row = db.prepare(`
      SELECT 
        pl.*,
        e.full_name,
        e.employee_code,
        e.id_number,
        pr.pay_date,
        pr.period_start,
        pr.period_end
      FROM payroll_lines pl
      JOIN employees e ON pl.employee_id = e.id
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE pl.id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    // 🔹 Fetch deductions for this payroll line
    const deductions = db.prepare(`
      SELECT id, description, amount
      FROM deductions
      WHERE payroll_line_id = ?
    `).all(id);

    row.deductions = deductions;

    res.json(row);

  } catch (err) {
    console.error("Payslip load error:", err);
    res.status(500).json({ error: "Failed to load payslip" });
  }
});
/* ===============================
   ADD DEDUCTION
================================ */
router.post("/deductions", (req, res) => {
  const { payroll_line_id, description, amount } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO deductions
      (payroll_line_id, description, amount)
      VALUES (?, ?, ?)
    `).run(payroll_line_id, description, amount);

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Add deduction error:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

/* ===============================
   DELETE DEDUCTION
================================ */
router.delete("/deductions/:id", (req, res) => {
  try {
    db.prepare(`
      DELETE FROM deductions
      WHERE id = ?
    `).run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete deduction error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
