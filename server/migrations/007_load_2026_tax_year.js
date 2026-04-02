exports.version = 7;

exports.up = db => {
  db.exec(`
    INSERT INTO tax_years
    (label, frequency, start_date, end_date, primary_rebate, secondary_rebate, tertiary_rebate)
    VALUES
    ('2026/2027', 'fortnightly', '2026-03-01', '2027-02-28', 17820, 9765, 3249);

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 0, 245100, 0, 0.18 FROM tax_years WHERE label = '2026/2027';

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 245100, 383100, 44118, 0.26 FROM tax_years WHERE label = '2026/2027';

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 383100, 530200, 79998, 0.31 FROM tax_years WHERE label = '2026/2027';

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 530200, 695800, 125599, 0.36 FROM tax_years WHERE label = '2026/2027';

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 695800, 887000, 185215, 0.39 FROM tax_years WHERE label = '2026/2027';

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 887000, 1878600, 259783, 0.41 FROM tax_years WHERE label = '2026/2027';

    INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
    SELECT id, 1878600, NULL, 666339, 0.45 FROM tax_years WHERE label = '2026/2027';
  `);
};

