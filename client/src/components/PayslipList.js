import Payslip from "./Payslip";
import React, { useEffect, useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
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
  Button,
  Checkbox
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
  const [selectedRun, setSelectedRun] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [activeSendId, setActiveSendId] = useState(null);

  /* ================= LOAD PAY RUNS ================= */
  useEffect(() => {
    axios.get(`${API}/api/payroll/runs`)
      .then(res => {
        setRuns(res.data || []);
      })
      .catch(err => {
        console.error("Failed to load runs:", err);
      });
  }, []);

  /* ================= LOAD PAYROLL LINES ================= */
  useEffect(() => {
    if (!selectedRun) {
      setLines([]);
      setSelected([]);
      return;
    }

    setLoading(true);
    setSelected([]);

    axios
      .get(`${API}/api/payroll/lines/${selectedRun}`)
      .then(res => {
        const sorted = (res.data || []).sort((a, b) =>
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

  /* ================= SELECTION LOGIC ================= */
  const handleSelectAll = e => {
    if (e.target.checked) {
      setSelected(lines.map(l => l.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = id => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  /* ================= SEND SELECTED EMAILS ================= */
  const handleSendSelected = async () => {
    if (selected.length === 0) {
      alert("Please select at least one payslip.");
      return;
    }

    setSending(true);

    try {
      for (const id of selected) {
        setActiveSendId(id);

        await new Promise(resolve => setTimeout(resolve, 500));

        const element = document.getElementById("payslip-content");

        if (!element) continue;

        const pdfBlob = await html2pdf()
          .set({
            margin: 10,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
          })
          .from(element)
          .outputPdf("blob");

        const arrayBuffer = await pdfBlob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        const line = lines.find(l => l.id === id);

        if (!line.email) continue;

        await axios.post(`${API}/api/email/send-payslip`, {
          email: line.email,
          full_name: line.full_name,
          pdfBase64: base64
        });
      }

      alert("Payslips sent successfully!");
      setSelected([]);
    } catch (err) {
      alert(
        "Email sending failed: " +
        (err.response?.data?.error || err.message)
      );
    }

    setActiveSendId(null);
    setSending(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={3}>
        Payslips
      </Typography>

      {/* PAY RUN SELECTOR */}
      <Box sx={{ mb: 3 }}>
        <Select
          value={selectedRun || ""}
          displayEmpty
          onChange={e => setSelectedRun(e.target.value || null)}
          sx={{ minWidth: 240 }}
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

      {/* ACTION BUTTON */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          disabled={!selectedRun || selected.length === 0 || sending}
          onClick={handleSendSelected}
        >
          {sending
            ? "Sending..."
            : `Send Selected (${selected.length})`}
        </Button>
      </Box>

      {/* DEFAULT LANDING STATE */}
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
            Please select a pay run to view and manage payslips.
          </Typography>
        </Box>
      ) : loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    lines.length > 0 &&
                    selected.length === lines.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
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
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(line.id)}
                      onChange={() => handleSelect(line.id)}
                    />
                  </TableCell>

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

      {/* HIDDEN PDF RENDERER */}
      {activeSendId && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <Payslip lineId={activeSendId} />
        </div>
      )}
    </Box>
  );
}

export default PayslipList;