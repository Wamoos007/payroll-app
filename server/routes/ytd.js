const express = require("express");
const router = express.Router();
const db = require("../db");

/* YTD PER EMPLOYEE */
router.get("/:year", (req, res) => {
  const { year } = req.params;

  try {
    const rows = db.prepare(`
      SELECT
        e.id as employee_id,
        e.full_name,
        SUM(
          (COALESCE(pl.hours_wk1,0) + COALESCE(pl.hours_wk2,0)) * pl.rate_used +
          COALESCE(pl.ot15_hours,0) * pl.rate_used * 1.5 +
          COALESCE(pl.ot20_hours,0) * pl.rate_used * 2
        ) as totalGross
      FROM payroll_lines pl
      JOIN pay_runs pr ON pl.pay_run_id = pr.id
      JOIN employees e ON pl.employee_id = e.id
      WHERE pr.pay_date LIKE ?
      GROUP BY e.id
    `).all(`${year}%`);

    const result = rows.map(r => {
      const gross = Number(r.totalGross || 0);
      const uif = gross * 0.01;
      const net = gross - uif;

      return {
        employee_id: r.employee_id,
        full_name: r.full_name,
        totalGross: gross,
        totalUif: uif,
        totalNet: net
      };
    });

    res.json(result);

  } catch (err) {
    console.error("YTD error:", err);
    res.status(500).json({ error: "YTD failed" });
  }
});

module.exports = router;
