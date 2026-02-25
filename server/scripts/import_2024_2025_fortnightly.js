const db = require("../db");

const TAX_YEAR_ID = 1;

// Clear previous entries
db.prepare(`
  DELETE FROM paye_tables WHERE tax_year_id = ?
`).run(TAX_YEAR_ID);

// FULL 2024/2025 Under 65 table (condensed import logic)

const insert = db.prepare(`
  INSERT INTO paye_tables
  (tax_year_id, income_from, income_to, annual_equivalent, tax_amount)
  VALUES (?, ?, ?, ?, ?)
`);

// This script generates rows programmatically
// Based on SARS table structure: each band increases by R1

let gross = 0;
let maxGross = 100000; // adjust upper range as needed

while (gross <= maxGross) {

  // LOOKUP FORMULA-BASED CALCULATION
  // We use annualised bracket math instead of 5000 manual rows

  const annual = gross * 26;

  let annualTax = 0;

  if (annual <= 237100) {
    annualTax = annual * 0.18;
  } else if (annual <= 370500) {
    annualTax = 42678 + (annual - 237100) * 0.26;
  } else if (annual <= 512800) {
    annualTax = 77362 + (annual - 370500) * 0.31;
  } else if (annual <= 673000) {
    annualTax = 121475 + (annual - 512800) * 0.36;
  } else if (annual <= 857900) {
    annualTax = 179147 + (annual - 673000) * 0.39;
  } else if (annual <= 1817000) {
    annualTax = 251258 + (annual - 857900) * 0.41;
  } else {
    annualTax = 644489 + (annual - 1817000) * 0.45;
  }

  // Subtract primary rebate (annual 2024/2025)
  const PRIMARY_REBATE_ANNUAL = 17235;

  annualTax -= PRIMARY_REBATE_ANNUAL;

  if (annualTax < 0) annualTax = 0;

  const periodTax = Math.floor(annualTax / 26);

  insert.run(
    TAX_YEAR_ID,
    gross,
    gross,
    annual,
    periodTax
  );

  gross++;
}

console.log("✅ 2024/2025 PAYE table generated successfully");