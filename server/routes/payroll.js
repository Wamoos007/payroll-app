const express = require("express");
const router = express.Router();
const db = require("../db");

function calculateTax(grossPay, taxYearId) {

  console.log("Gross received:", grossPay);
  console.log("Tax year id:", taxYearId);

  const annualIncome = grossPay * 26;
  console.log("Annual income:", annualIncome);

  const bracket = db.prepare(`
    SELECT *
    FROM tax_brackets
    WHERE tax_year_id = ?
    AND min_income <= ?
    AND (max_income IS NULL OR max_income > ?)
    LIMIT 1
  `).get(taxYearId, annualIncome, annualIncome);

  console.log("Bracket found:", bracket);

  if (!bracket) return 0;

  let annualTax =
    bracket.base_tax +
    (annualIncome - bracket.min_income) * bracket.marginal_rate;

  console.log("Annual tax before rebate:", annualTax);

  const taxYear = db.prepare(`
    SELECT primary_rebate
    FROM tax_years
    WHERE id = ?
  `).get(taxYearId);

  console.log("Tax year rebate:", taxYear);

  if (taxYear && taxYear.primary_rebate) {
    annualTax -= taxYear.primary_rebate * 26;
  }

  if (annualTax < 0) annualTax = 0;

  const periodTax = Math.floor(annualTax / 26);

  console.log("Final period tax:", periodTax);

  return periodTax;
}

/* ===============================
   GET RUNS
================================ */
router.get("/runs", (req, res) => {
  const { year } = req.query;

  let query = "SELECT * FROM pay_runs";
  let params = [];

  if (year) {
    query += " WHERE strftime('%Y', pay_date) = ?";
    params.push(year);
  }

  query += " ORDER BY pay_date DESC";

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

/* ===============================
   CREATE RUN
================================ */
router.post("/runs", (req, res) => {
  const { period_start, period_end, pay_date } = req.body;

  try {
    // Find correct tax year based on pay_date
    const taxYear = db.prepare(`
      SELECT id
      FROM tax_years
      WHERE start_date <= ?
      AND end_date >= ?
      AND locked = 1
      LIMIT 1
    `).get(pay_date, pay_date);

    if (!taxYear) {
      return res.status(400).json({ error: "No locked tax year configured for this date" });
    }

    // Insert pay run WITH tax_year_id
    const result = db.prepare(`
      INSERT INTO pay_runs 
      (period_start, period_end, pay_date, created_at, tax_year_id)
      VALUES (?, ?, ?, datetime('now'), ?)
    `).run(period_start, period_end, pay_date, taxYear.id);

    const runId = result.lastInsertRowid;

    const employees = db.prepare(`
      SELECT id, hourly_rate FROM employees WHERE active = 1
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
   GET LINES FOR RUN
================================ */
router.get("/lines/:runId", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT pl.*, e.full_name, e.employee_code, e.email
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
   UPDATE LINE (AUTO SAVE)
================================ */
router.put("/lines/:id", (req, res) => {
  const { hours_wk1, hours_wk2, ot15_hours, ot20_hours } = req.body;

  try {
    // Get current line to know rate
    const existing = db.prepare(`
      SELECT rate_used
      FROM payroll_lines
      WHERE id = ?
    `).get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: "Line not found" });
    }

    const rate = Number(existing.rate_used || 0);

    const normalHours = Number(hours_wk1 || 0) + Number(hours_wk2 || 0);
    const ot15 = Number(ot15_hours || 0);
    const ot20 = Number(ot20_hours || 0);

    const normalPay = normalHours * rate;
    const ot15Pay = ot15 * rate * 1.5;
    const ot20Pay = ot20 * rate * 2;

    const gross = normalPay + ot15Pay + ot20Pay;

    // Get tax year linked to this payroll line
      const run = db.prepare(`
        SELECT pr.tax_year_id
        FROM payroll_lines pl
        JOIN pay_runs pr ON pl.pay_run_id = pr.id
        WHERE pl.id = ?
      `).get(req.params.id);

      console.log("Run tax year result:", run);

      if (!run || !run.tax_year_id) {
        console.warn("Missing tax year for payroll line:", req.params.id);
        return res.status(400).json({ error: "Tax year not linked to pay run" });
      }

      // Load settings
        const settingsRows = db.prepare("SELECT key, value FROM settings").all();

        const settings = {};
        settingsRows.forEach(row => {
          settings[row.key] = row.value;
        });

      let tax = 0;

        if (settings.enable_paye === "1") {
          tax = calculateTax(gross, run.tax_year_id);
        }

    db.prepare(`
      UPDATE payroll_lines
      SET 
        hours_wk1 = ?,
        hours_wk2 = ?,
        ot15_hours = ?,
        ot20_hours = ?,
        tax_amount = ?
      WHERE id = ?
    `).run(
      hours_wk1,
      hours_wk2,
      ot15_hours,
      ot20_hours,
      tax,
      req.params.id
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ===============================
   GET DATA FOR PAYSLIP
================================ */
router.get("/lines/forPayslip/:id", (req, res) => {
  try {
    const row = db.prepare(`
      SELECT 
        pl.*,
        e.full_name,
        e.employee_code,
        e.id_number,
        e.email,
        pr.pay_date,
        pr.period_start,
        pr.period_end
      FROM payroll_lines pl
      JOIN employees e ON pl.employee_id = e.id
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE pl.id = ?
    `).get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    const deductions = db.prepare(`
      SELECT id, description, amount
      FROM deductions
      WHERE payroll_line_id = ?
    `).all(req.params.id);

    row.deductions = deductions;

// Load settings
const settingsRows = db.prepare("SELECT key, value FROM settings").all();

const settings = {};
settingsRows.forEach(r => {
  settings[r.key] = r.value;
});

row.settings = settings;

res.json(row);

  } catch (err) {
    res.status(500).json({ error: "Payslip failed" });
  }
});

/* ===============================
   ADD DEDUCTION
================================ */
router.post("/deductions", (req, res) => {
  const { payroll_line_id, description, amount } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO deductions (payroll_line_id, description, amount)
      VALUES (?, ?, ?)
    `).run(payroll_line_id, description, amount);

    res.json({ id: result.lastInsertRowid });

  } catch (err) {
    res.status(500).json({ error: "Insert failed" });
  }
});

/* ===============================
   DELETE DEDUCTION
================================ */
router.delete("/deductions/:id", (req, res) => {
  const stmt = db.prepare(
    "DELETE FROM deductions WHERE id = ?"
  );
  stmt.run(req.params.id);
  res.json({ success: true });
});

/* ===============================
   YTD SUMMARY
================================ */
router.get("/ytd-summary/:year", (req, res) => {
  try {
    const row = db.prepare(`
      SELECT 
        SUM(
          (COALESCE(pl.hours_wk1,0) + COALESCE(pl.hours_wk2,0)) * COALESCE(pl.rate_used,0)
          + COALESCE(pl.ot15_hours,0) * COALESCE(pl.rate_used,0) * 1.5
          + COALESCE(pl.ot20_hours,0) * COALESCE(pl.rate_used,0) * 2
        ) AS totalGross
      FROM payroll_lines pl
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE strftime('%Y', pr.pay_date) = ?
    `).get(req.params.year);

    const gross = Number(row.totalGross || 0);

const taxRow = db.prepare(`
  SELECT SUM(COALESCE(tax_amount,0)) as totalTax
  FROM payroll_lines pl
  JOIN pay_runs pr ON pl.pay_run_id = pr.id
  WHERE strftime('%Y', pr.pay_date) = ?
`).get(req.params.year);

const totalTax = Number(taxRow.totalTax || 0);
const uif = gross * 0.01;
const net = gross - uif - totalTax;

    res.json({
  totalGross: gross,
  totalUif: uif,
  totalTax: totalTax,
  totalNet: net
});
  } catch (err) {
    res.status(500).json({ error: "YTD failed" });
  }
});

router.get("/monthly-summary/:year", (req, res) => {
  const { year } = req.params;

  try {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const rows = db.prepare(`
      SELECT 
  strftime('%m', pr.pay_date) as month,
  SUM(
    (COALESCE(pl.hours_wk1,0) + COALESCE(pl.hours_wk2,0)) * COALESCE(pl.rate_used,0)
    + COALESCE(pl.ot15_hours,0) * COALESCE(pl.rate_used,0) * 1.5
    + COALESCE(pl.ot20_hours,0) * COALESCE(pl.rate_used,0) * 2
  ) as totalGross,
  SUM(COALESCE(pl.tax_amount,0)) as totalTax
      FROM payroll_lines pl
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE pr.pay_date BETWEEN ? AND ?
      GROUP BY month
      ORDER BY month
    `).all(start, end);

    res.json(rows);

  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ error: "Monthly summary failed", details: err.message });
  }
});

/* ===============================
   SARS EMP201 SUMMARY
================================ */
router.get("/sars-summary/:year", (req, res) => {
  const { year } = req.params;

  try {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const rows = db.prepare(`
      SELECT 
        strftime('%m', pr.pay_date) as month,

        SUM(
          (COALESCE(pl.hours_wk1,0) + COALESCE(pl.hours_wk2,0)) * COALESCE(pl.rate_used,0)
          + COALESCE(pl.ot15_hours,0) * COALESCE(pl.rate_used,0) * 1.5
          + COALESCE(pl.ot20_hours,0) * COALESCE(pl.rate_used,0) * 2
        ) as totalGross,

        SUM(COALESCE(pl.tax_amount,0)) as totalPAYE

      FROM payroll_lines pl
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      WHERE pr.pay_date BETWEEN ? AND ?
      GROUP BY month
      ORDER BY month
    `).all(start, end);

    const formatted = rows.map(r => {
      const gross = Number(r.totalGross || 0);
      const paye = Number(r.totalPAYE || 0);
      const uifEmployee = gross * 0.01;
      const uifEmployer = gross * 0.01;

      return {
        month: r.month,
        gross,
        paye,
        uifEmployee,
        uifEmployer,
        totalDue: paye + uifEmployee + uifEmployer
      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("SARS summary error:", err);
    res.status(500).json({ error: "SARS summary failed" });
  }
});
/* ===============================
   GET PAYE TABLE
================================ */
router.get("/paye-table", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM tax_rates
      ORDER BY min_income ASC
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load PAYE table" });
  }
});
/* ===============================
   GET ACTIVE TAX YEAR
================================ */
router.get("/tax-year/active", (req, res) => {
  try {
    const year = db.prepare(`
      SELECT *
      FROM tax_years
      WHERE locked = 1
      ORDER BY start_date DESC
      LIMIT 1
    `).get();

    res.json(year);

  } catch (err) {
    res.status(500).json({ error: "Failed to load active tax year" });
  }
});
/* ===============================
   GET TAX BRACKETS FOR YEAR
================================ */
router.get("/tax-brackets/:taxYearId", (req, res) => {
  try {
    const brackets = db.prepare(`
      SELECT min_income, max_income, base_tax, marginal_rate
      FROM tax_brackets
      WHERE tax_year_id = ?
      ORDER BY min_income ASC
    `).all(req.params.taxYearId);

    const taxYear = db.prepare(`
      SELECT label, start_date, end_date, primary_rebate
      FROM tax_years
      WHERE id = ?
    `).get(req.params.taxYearId);

    res.json({
      taxYear,
      brackets
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to load tax brackets" });
  }
});

/* ===============================
   GET SETTINGS
================================ */
router.get("/settings", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM settings").all();

    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

/* ===============================
   UPDATE SETTING
================================ */
router.put("/settings/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);

    // 🔥 If PAYE turned off, reset all tax
    if (key === "enable_paye" && value === "0") {
      db.prepare(`
        UPDATE payroll_lines
        SET tax_amount = 0
      `).run();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

/* ===============================
   ADD MISSING EMPLOYEES TO RUN
================================ */
router.post("/runs/:runId/add-missing", (req, res) => {
  try {
    const runId = req.params.runId;

    // Find active employees NOT already in this run
    const employees = db.prepare(`
      SELECT e.id, e.hourly_rate
      FROM employees e
      WHERE e.active = 1
      AND e.id NOT IN (
        SELECT employee_id
        FROM payroll_lines
        WHERE pay_run_id = ?
      )
    `).all(runId);

    if (employees.length === 0) {
      return res.json({ success: true, added: 0 });
    }

    const insert = db.prepare(`
      INSERT INTO payroll_lines
      (pay_run_id, employee_id, rate_used)
      VALUES (?, ?, ?)
    `);

    employees.forEach(emp => {
      insert.run(runId, emp.id, emp.hourly_rate);
    });

    res.json({
      success: true,
      added: employees.length
    });

  } catch (err) {
    console.error("Add missing employees error:", err);
    res.status(500).json({ error: "Failed to add employees" });
  }
});

module.exports = router;