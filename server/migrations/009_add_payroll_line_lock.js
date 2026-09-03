exports.version = 9;

exports.up = `
ALTER TABLE payroll_lines ADD COLUMN locked INTEGER NOT NULL DEFAULT 0;
`;

exports.down = `
`;
