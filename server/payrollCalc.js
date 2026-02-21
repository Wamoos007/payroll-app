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

module.exports = { computePayroll };
