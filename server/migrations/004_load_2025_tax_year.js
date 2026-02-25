exports.version = 4;

exports.up = `
INSERT INTO tax_years
(label, frequency, start_date, end_date, primary_rebate, locked)
VALUES
('2025/2026', 'fortnightly', '2025-03-01', '2026-02-28', 17235, 1);

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 0, 237100, 0, 0.18 FROM tax_years WHERE label = '2025/2026';

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 237100, 370500, 42678, 0.26 FROM tax_years WHERE label = '2025/2026';

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 370500, 512800, 77362, 0.31 FROM tax_years WHERE label = '2025/2026';

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 512800, 673000, 121475, 0.36 FROM tax_years WHERE label = '2025/2026';

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 673000, 857900, 179147, 0.39 FROM tax_years WHERE label = '2025/2026';

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 857900, 1817000, 251258, 0.41 FROM tax_years WHERE label = '2025/2026';

INSERT INTO tax_brackets (tax_year_id, min_income, max_income, base_tax, marginal_rate)
SELECT id, 1817000, NULL, 644489, 0.45 FROM tax_years WHERE label = '2025/2026';
`;