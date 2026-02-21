const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/annual", (req, res) => {
  const year = req.query.year;

  const sql = `
    SELECT
      strftime('%m', pr.pay_date) AS month,
      SUM(
        (pl.hours_wk1 + pl.hours_wk2) * pl.rate_used +
        pl.ot15_hours * pl.rate_used * 1.5 +
        pl.ot20_hours * pl.rate_used * 2
      ) AS gross,
      SUM(
        (
          (pl.hours_wk1 + pl.hours_wk2) * pl.rate_used +
          pl.ot15_hours * pl.rate_used * 1.5 +
          pl.ot20_hours * pl.rate_used * 2
        ) * 0.99
      ) AS net
    FROM payroll_lines pl
    JOIN pay_runs pr ON pr.id = pl.pay_run_id
    WHERE strftime('%Y', pr.pay_date) = ?
    GROUP BY month
  `;

  db.all(sql, [year], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const map = {};
    rows.forEach(r => {
      map[r.month] = {
        gross: Number(r.gross.toFixed(2)),
        net: Number(r.net.toFixed(2))
      };
    });

    const result = months.map((name, index) => {
      const key = String(index + 1).padStart(2, "0");
      return {
        month: name,
        gross: map[key]?.gross || 0,
        net: map[key]?.net || 0
      };
    });

    res.json(result);
  });
});

module.exports = router;
