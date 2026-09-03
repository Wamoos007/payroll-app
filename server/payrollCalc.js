const db = require("./db");

/* ===============================
   FIND TAX YEAR FOR A GIVEN DATE
================================ */
function getTaxYearForDate(dateValue) {
  return db.prepare(`
    SELECT id, label, start_date, end_date, primary_rebate
    FROM tax_years
    WHERE start_date <= ?
      AND end_date >= ?
    ORDER BY start_date DESC
    LIMIT 1
  `).get(dateValue, dateValue);
}

/* ===============================
   CALCULATE PAYE FOR A PAY PERIOD
================================ */
function calculateTax(grossPay, taxYearId) {
  const annualIncome = grossPay * 26;

  const bracket = db.prepare(`
    SELECT *
    FROM tax_brackets
    WHERE tax_year_id = ?
    AND min_income <= ?
    AND (max_income IS NULL OR max_income > ?)
    LIMIT 1
  `).get(taxYearId, annualIncome, annualIncome);

  if (!bracket) return 0;

  let annualTax =
    bracket.base_tax +
    (annualIncome - bracket.min_income) * bracket.marginal_rate;

  const taxYear = db.prepare(`
    SELECT primary_rebate
    FROM tax_years
    WHERE id = ?
  `).get(taxYearId);

  if (taxYear && taxYear.primary_rebate) {
    annualTax -= taxYear.primary_rebate * 26;
  }

  if (annualTax < 0) annualTax = 0;

  return Math.floor(annualTax / 26);
}

/* ===============================
   GROSS / UIF / NET FOR A LINE
================================ */
function computePayroll(line) {
  const normalHours =
    Number(line.hours_wk1) + Number(line.hours_wk2);

  const rate = Number(line.rate_used);

  const gross =
    (normalHours * rate) +
    (Number(line.ot15_hours) * rate * 1.5) +
    (Number(line.ot20_hours) * rate * 2);

  const uif = gross * 0.01;

  const net = gross - uif;

  return {
    normalHours,
    gross,
    uif,
    net
  };
}

module.exports = { computePayroll, getTaxYearForDate, calculateTax };
