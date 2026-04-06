import React, { useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import axios from "axios";
import API from "../api";
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField
} from "@mui/material";

const money = value =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2
  }).format(Number(value || 0));

function getLineSummary(line) {
  const normalHours = Number(line.hours_wk1 || 0) + Number(line.hours_wk2 || 0);
  const overtime15Hours = Number(line.ot15_hours || 0);
  const overtime20Hours = Number(line.ot20_hours || 0);
  const totalHours = normalHours + overtime15Hours + overtime20Hours;
  const rate = Number(line.rate_used || 0);
  const grossPay =
    (normalHours * rate) +
    (overtime15Hours * rate * 1.5) +
    (overtime20Hours * rate * 2);
  const taxAmount = Number(line.tax_amount || 0);
  const uifAmount = grossPay * 0.01;
  const manualDeductions = Number(line.manual_deductions || 0);
  const totalDeductions = taxAmount + uifAmount + manualDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    totalHours,
    grossPay,
    taxAmount,
    uifAmount,
    manualDeductions,
    totalDeductions,
    netPay
  };
}

function EnterHours({ readOnly = false }) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [lines, setLines] = useState([]);

  /* ================= LOAD RUNS ================= */
  useEffect(() => {
    axios.get(`${API}/api/payroll/runs`).then(res => {
      setRuns(res.data || []);
    });
  }, []);

  /* ================= LOAD LINES ================= */
  useEffect(() => {
    if (!selectedRun) {
      setLines([]);
      return;
    }

    axios
      .get(`${API}/api/payroll/lines/${selectedRun}`)
      .then(res => {
        setLines(res.data || []);
      });
  }, [selectedRun]);

  /* ================= UPDATE HOURS ================= */
  const handleChange = (id, field, value) => {
    const updated = lines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    );

    setLines(updated);

    const updatedLine = updated.find(l => l.id === id);

    axios.put(`${API}/api/payroll/lines/${id}`, {
      hours_wk1: updatedLine.hours_wk1,
      hours_wk2: updatedLine.hours_wk2,
      ot15_hours: updatedLine.ot15_hours,
      ot20_hours: updatedLine.ot20_hours
    });
  };

  /* ================= ADD MISSING EMPLOYEES ================= */
  const handleAddMissing = async () => {
    if (!selectedRun) return;

    await axios.post(
      `${API}/api/payroll/runs/${selectedRun}/add-missing`
    );

    const res = await axios.get(
      `${API}/api/payroll/lines/${selectedRun}`
    );

    setLines(res.data || []);
  };

  /* ================= PROFESSIONAL PDF EXPORT ================= */
  const handleExportPDF = () => {
    if (!selectedRun || lines.length === 0) return;

    const run = runs.find(r => r.id === selectedRun);

    const rows = lines.map(line => {
      const summary = getLineSummary(line);

      return `
        <tr>
          <td>${line.full_name} (${line.employee_code})</td>
          <td>${line.hours_wk1 || 0}</td>
          <td>${line.hours_wk2 || 0}</td>
          <td>${line.ot15_hours || 0}</td>
          <td>${line.ot20_hours || 0}</td>
          <td>${summary.totalHours}</td>
          <td>${money(line.rate_used)}</td>
          <td>${money(summary.grossPay)}</td>
          <td>${money(summary.totalDeductions)}</td>
          <td>${money(summary.netPay)}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px;">
          <div>
            <h2 style="margin:0 0 6px;">Payroll Hours Report</h2>
            <p style="margin:0;"><strong>Pay Date:</strong> ${run?.pay_date || ""}</p>
          </div>
          <div style="text-align:right; color:#475569;">
            <p style="margin:0;">Gross, deductions, and net pay include saved payroll values.</p>
          </div>
        </div>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="background:#e2e8f0;">
              <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Employee</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Week 1</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Week 2</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">OT 1.5</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">OT 2.0</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Hours</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Rate</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Gross Pay</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Deductions</th>
              <th style="border:1px solid #cbd5e1; padding:8px;">Net Pay</th>
            </tr>
          </thead>
          <tbody style="font-size:12px;">
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    html2pdf()
      .set({
        margin: 10,
        filename: `Hours_${run?.pay_date}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
      })
      .from(html)
      .save();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Enter Hours
      </Typography>

      {/* RUN SELECTOR */}
      <Box sx={{ mb: 3 }}>
        <Select
          value={selectedRun || ""}
          displayEmpty
          onChange={(e) =>
            setSelectedRun(e.target.value || null)
          }
          sx={{ width: 250 }}
        >
          <MenuItem value="">
            <em>Select Pay Run</em>
          </MenuItem>

          {runs.map(run => (
            <MenuItem key={run.id} value={run.id}>
              {run.pay_date}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* ACTION BUTTONS */}
      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          disabled={!selectedRun || readOnly}
          onClick={handleAddMissing}
        >
          Add New Employees To This Run
        </Button>

        <Button
          variant="contained"
          disabled={!selectedRun}
          onClick={handleExportPDF}
        >
          Export Hours Report
        </Button>
      </Box>

      {!selectedRun ? (
        <Box
          sx={{
            mt: 5,
            p: 5,
            backgroundColor: "#ffffff",
            borderRadius: 2,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Pay Run Selected
          </Typography>

          <Typography color="text.secondary">
            Please select a pay run to view and edit hours.
          </Typography>
        </Box>
      ) : (
        <Paper sx={{ overflow: "auto" }}>
          <Table sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Week 1</TableCell>
              <TableCell>Week 2</TableCell>
              <TableCell>OT 1.5</TableCell>
              <TableCell>OT 2.0</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Gross Pay</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>Net Pay</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {lines.map(line => {
              const summary = getLineSummary(line);

              return (
                <TableRow key={line.id}>
                  <TableCell>
                    {line.full_name} ({line.employee_code})
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      disabled={readOnly}
                      value={line.hours_wk1 || 0}
                      onChange={(e) =>
                        handleChange(
                          line.id,
                          "hours_wk1",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      disabled={readOnly}
                      value={line.hours_wk2 || 0}
                      onChange={(e) =>
                        handleChange(
                          line.id,
                          "hours_wk2",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      disabled={readOnly}
                      value={line.ot15_hours || 0}
                      onChange={(e) =>
                        handleChange(
                          line.id,
                          "ot15_hours",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      disabled={readOnly}
                      value={line.ot20_hours || 0}
                      onChange={(e) =>
                        handleChange(
                          line.id,
                          "ot20_hours",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>{summary.totalHours}</TableCell>
                  <TableCell>{money(line.rate_used)}</TableCell>
                  <TableCell>{money(summary.grossPay)}</TableCell>
                  <TableCell>{money(summary.totalDeductions)}</TableCell>
                  <TableCell>{money(summary.netPay)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

export default EnterHours;
