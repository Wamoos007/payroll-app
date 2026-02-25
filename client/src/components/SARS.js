import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Tabs,
  Tab,
  Paper,
  Divider
} from "@mui/material";

const API = "http://localhost:3001";

const money = v =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2
  }).format(Number(v || 0));

function SARS() {
  const currentYear = new Date().getFullYear();

  const [tab, setTab] = useState(0);
  const [year, setYear] = useState(currentYear);
  const [emp201Data, setEmp201Data] = useState([]);
  const [taxYear, setTaxYear] = useState(null);
  const [brackets, setBrackets] = useState([]);

  /* ================= LOAD EMP201 ================= */
  useEffect(() => {
    if (tab === 0) {
      axios
        .get(`${API}/api/payroll/sars-summary/${year}`)
        .then(res => setEmp201Data(res.data))
        .catch(err => console.error(err));
    }
  }, [year, tab]);

  /* ================= LOAD ACTIVE TAX YEAR + BRACKETS ================= */
  useEffect(() => {
    const loadTaxData = async () => {
      try {
        const yearRes = await axios.get(
          `${API}/api/payroll/tax-year/active`
        );

        const activeYear = yearRes.data;

        if (!activeYear) return;

        const bracketRes = await axios.get(
          `${API}/api/payroll/tax-brackets/${activeYear.id}`
        );

        setTaxYear(activeYear);
        setBrackets(bracketRes.data.brackets);
      } catch (err) {
        console.error("Tax load error:", err);
      }
    };

    loadTaxData();
  }, []);

  /* ================= EMP201 TOTALS ================= */
  const totals = emp201Data.reduce(
    (acc, row) => {
      acc.gross += row.gross;
      acc.paye += row.paye;
      acc.uifEmployee += row.uifEmployee;
      acc.uifEmployer += row.uifEmployer;
      acc.totalDue += row.totalDue;
      return acc;
    },
    { gross: 0, paye: 0, uifEmployee: 0, uifEmployer: 0, totalDue: 0 }
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        SARS
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="EMP201" />
          <Tab label="PAYE Table" />
          <Tab label="IRP5" />
        </Tabs>
      </Paper>

      {/* ================= EMP201 TAB ================= */}
      {tab === 0 && (
        <>
          <TextField
            label="Year"
            type="number"
            value={year}
            onChange={e => setYear(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>PAYE</TableCell>
                <TableCell>UIF Employee</TableCell>
                <TableCell>UIF Employer</TableCell>
                <TableCell>Total Due</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {emp201Data.map(row => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{money(row.gross)}</TableCell>
                  <TableCell>{money(row.paye)}</TableCell>
                  <TableCell>{money(row.uifEmployee)}</TableCell>
                  <TableCell>{money(row.uifEmployer)}</TableCell>
                  <TableCell>{money(row.totalDue)}</TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell>{money(totals.gross)}</TableCell>
                <TableCell>{money(totals.paye)}</TableCell>
                <TableCell>{money(totals.uifEmployee)}</TableCell>
                <TableCell>{money(totals.uifEmployer)}</TableCell>
                <TableCell>{money(totals.totalDue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}

      {/* ================= PAYE TAB ================= */}
      {tab === 1 && (
        <>
          {taxYear && (
            <>
              <Typography variant="h6">
                Tax Year: {taxYear.label}
              </Typography>

              <Typography>
                Period: {taxYear.start_date} – {taxYear.end_date}
              </Typography>

              <Typography>
                Primary Rebate (Fortnightly): {money(taxYear.primary_rebate)}
              </Typography>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Min Income (Annual)</TableCell>
                <TableCell>Max Income (Annual)</TableCell>
                <TableCell>Base Tax</TableCell>
                <TableCell>Marginal Rate</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {brackets.map((b, index) => (
                <TableRow key={index}>
                  <TableCell>{money(b.min_income)}</TableCell>
                  <TableCell>
                    {b.max_income ? money(b.max_income) : "No Limit"}
                  </TableCell>
                  <TableCell>{money(b.base_tax)}</TableCell>
                  <TableCell>
                    {(b.marginal_rate * 100).toFixed(0)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* ================= IRP5 TAB ================= */}
      {tab === 2 && (
        <>
          <Typography variant="h6" gutterBottom>
            IRP5 / Tax Certificates
          </Typography>

          <Typography>
            IRP5 generation module coming next. This will generate annual tax
            certificates per employee including PAYE and UIF totals.
          </Typography>
        </>
      )}
    </Box>
  );
}

export default SARS;