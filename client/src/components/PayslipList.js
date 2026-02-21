import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Button
} from "@mui/material";

const API = "http://localhost:3001";

const money = v =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2
  }).format(Number(v || 0));

function PayslipList() {
  const navigate = useNavigate();

  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState("");
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     LOAD PAY RUNS
  =============================== */
  useEffect(() => {
    axios.get(`${API}/api/payroll/runs`).then(res => {
      setRuns(res.data);
      if (res.data.length > 0) {
        setSelectedRun(res.data[0].id);
      }
    });
  }, []);

  /* ===============================
     LOAD PAYROLL LINES
  =============================== */
  useEffect(() => {
    if (!selectedRun) return;

    setLoading(true);

    axios
      .get(`${API}/api/payroll/lines/${selectedRun}`)
      .then(res => {
        const sorted = res.data.sort((a, b) =>
          a.employee_code.localeCompare(b.employee_code)
        );
        setLines(sorted);
      })
      .catch(err => {
        console.error("Failed to load payslips:", err);
        setLines([]);
      })
      .finally(() => setLoading(false));
  }, [selectedRun]);

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Payslips
      </Typography>

      {/* PAY RUN SELECTOR */}
      <Select
        value={selectedRun}
        onChange={e => setSelectedRun(e.target.value)}
        sx={{ mb: 4, minWidth: 240 }}
      >
        {runs.map(run => (
          <MenuItem key={run.id} value={run.id}>
            {run.pay_date}
          </MenuItem>
        ))}
      </Select>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell align="right">Gross</TableCell>
              <TableCell align="right">UIF</TableCell>
              <TableCell align="right">Net</TableCell>
              <TableCell align="center">Payslip</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {lines.map(line => {
              const gross =
                (Number(line.hours_wk1 || 0) +
                  Number(line.hours_wk2 || 0)) *
                  Number(line.rate_used || 0) +
                Number(line.ot15_hours || 0) *
                  Number(line.rate_used || 0) *
                  1.5 +
                Number(line.ot20_hours || 0) *
                  Number(line.rate_used || 0) *
                  2;

              const uif = gross * 0.01;
              const net = gross - uif;

              return (
                <TableRow key={line.id}>
                  <TableCell>
                    {line.full_name} ({line.employee_code})
                  </TableCell>

                  <TableCell align="right">
                    {money(gross)}
                  </TableCell>

                  <TableCell align="right">
                    {money(uif)}
                  </TableCell>

                  <TableCell align="right">
                    {money(net)}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      onClick={() =>
                        navigate(`/payslip/${line.id}`)
                      }
                    >
                      VIEW
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

export default PayslipList;
