module.exports = [
  {
    label: "2025/2026",
    frequency: "fortnightly",
    start_date: "2025-03-01",
    end_date: "2026-02-28",
    primary_rebate: 17235,
    secondary_rebate: 0,
    tertiary_rebate: 0,
    brackets: [
      { min_income: 0, max_income: 237100, base_tax: 0, marginal_rate: 0.18 },
      { min_income: 237100, max_income: 370500, base_tax: 42678, marginal_rate: 0.26 },
      { min_income: 370500, max_income: 512800, base_tax: 77362, marginal_rate: 0.31 },
      { min_income: 512800, max_income: 673000, base_tax: 121475, marginal_rate: 0.36 },
      { min_income: 673000, max_income: 857900, base_tax: 179147, marginal_rate: 0.39 },
      { min_income: 857900, max_income: 1817000, base_tax: 251258, marginal_rate: 0.41 },
      { min_income: 1817000, max_income: null, base_tax: 644489, marginal_rate: 0.45 }
    ]
  },
  {
    label: "2026/2027",
    frequency: "fortnightly",
    start_date: "2026-03-01",
    end_date: "2027-02-28",
    primary_rebate: 17820,
    secondary_rebate: 9765,
    tertiary_rebate: 3249,
    brackets: [
      { min_income: 0, max_income: 245100, base_tax: 0, marginal_rate: 0.18 },
      { min_income: 245100, max_income: 383100, base_tax: 44118, marginal_rate: 0.26 },
      { min_income: 383100, max_income: 530200, base_tax: 79998, marginal_rate: 0.31 },
      { min_income: 530200, max_income: 695800, base_tax: 125599, marginal_rate: 0.36 },
      { min_income: 695800, max_income: 887000, base_tax: 185215, marginal_rate: 0.39 },
      { min_income: 887000, max_income: 1878600, base_tax: 259783, marginal_rate: 0.41 },
      { min_income: 1878600, max_income: null, base_tax: 666339, marginal_rate: 0.45 }
    ]
  }
];
