const taxYearSeeds = require("./taxYearSeeds");

function seedTaxYears(db) {
  const findTaxYear = db.prepare(`
    SELECT id
    FROM tax_years
    WHERE label = ?
    LIMIT 1
  `);

  const insertTaxYear = db.prepare(`
    INSERT INTO tax_years (
      label,
      frequency,
      start_date,
      end_date,
      primary_rebate,
      secondary_rebate,
      tertiary_rebate
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBracket = db.prepare(`
    INSERT INTO tax_brackets (
      tax_year_id,
      min_income,
      max_income,
      base_tax,
      marginal_rate
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const taxYear of taxYearSeeds) {
      const existing = findTaxYear.get(taxYear.label);

      if (existing) {
        continue;
      }

      const result = insertTaxYear.run(
        taxYear.label,
        taxYear.frequency,
        taxYear.start_date,
        taxYear.end_date,
        taxYear.primary_rebate,
        taxYear.secondary_rebate || 0,
        taxYear.tertiary_rebate || 0
      );

      for (const bracket of taxYear.brackets) {
        insertBracket.run(
          result.lastInsertRowid,
          bracket.min_income,
          bracket.max_income,
          bracket.base_tax,
          bracket.marginal_rate
        );
      }
    }
  });

  transaction();
}

module.exports = seedTaxYears;
