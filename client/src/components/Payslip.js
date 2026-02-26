import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Typography,
  Button,
  Grid,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";

const API = "http://localhost:3001";

const money = v =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2
  }).format(Number(v || 0));

const formatDate = dateString => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

function Payslip(props) {
  const params = useParams();
  const lineId = props?.lineId || params.lineId;

  const [data, setData] = useState(null);
  const [company, setCompany] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const pdfRef = useRef(null);

  const loadData = async () => {
    const res1 = await axios.get(`${API}/api/payroll/lines/forPayslip/${lineId}`);
    const res2 = await axios.get(`${API}/api/company`);
    setData(res1.data);
    setCompany(res2.data);
  };

  useEffect(() => {
    if (lineId) loadData();
  }, [lineId]);

  if (!data || !company) return null;

  /* ================= CALCULATIONS ================= */

  const normalHours = Number(data.hours_wk1 ?? 0) + Number(data.hours_wk2 ?? 0);
  const rate = Number(data.rate_used ?? 0);
  const ot15 = Number(data.ot15_hours ?? 0);
  const ot20 = Number(data.ot20_hours ?? 0);

  const normalPay = normalHours * rate;
  const ot15Pay = ot15 * rate * 1.5;
  const ot20Pay = ot20 * rate * 2;

  const gross = normalPay + ot15Pay + ot20Pay;
  const uif = gross * 0.01;
  const tax = Number(data.tax_amount ?? 0);

  const manualDeductions =
    (data.deductions || []).reduce((sum, d) => sum + Number(d.amount ?? 0), 0);

  const payeEnabled = data.settings?.enable_paye === "1";

  const totalDeductions =
    uif +
    manualDeductions +
    (payeEnabled ? tax : 0);

  const netPay = gross - totalDeductions;

  const referenceNumber = `PS-${new Date(data.pay_date).getFullYear()}-${String(
    new Date(data.pay_date).getMonth() + 1
  ).padStart(2, "0")}-${String(data.id).padStart(4, "0")}`;

  /* ================= ACTIONS ================= */

  const confirmDelete = async () => {
    if (!deleteId) return;

    await axios.delete(`${API}/api/payroll/deductions/${deleteId}`);
    setShowDeleteDialog(false);
    setDeleteId(null);
    loadData();
  };

  const addDeduction = async () => {
    if (!desc || !amount) return;

    await axios.post(`${API}/api/payroll/deductions`, {
      payroll_line_id: lineId,
      description: desc,
      amount: Number(amount)
    });

    setDesc("");
    setAmount("");
    setShowAdd(false);
    loadData();
  };

  const handleExport = () => {
    if (!pdfRef.current) return;

    html2pdf()
      .set({
        margin: 10,
        filename: `Payslip_${referenceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
      })
      .from(pdfRef.current)
      .save();
  };

  return (
    <Box>
      {/* ACTION BUTTONS */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={handleExport}>
          Download PDF
        </Button>
        <Button variant="outlined" onClick={() => setShowAdd(true)}>
          Add Deduction
        </Button>
      </Box>

      {/* ADD DEDUCTION */}
      {showAdd && (
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <TextField size="small" label="Description"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <TextField size="small" type="number" label="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <Button variant="contained" onClick={addDeduction}>Save</Button>
          <Button onClick={() => setShowAdd(false)}>Cancel</Button>
        </Box>
      )}

      {/* PAYSLIP BODY */}
      <Box
        ref={pdfRef}
        sx={{
          width: 820,
          mx: "auto",
          backgroundColor: "#ffffff",
          border: "1px solid #081e4d",
          fontSize: 12
        }}
      >

        {/* HEADER */}
        <Box sx={{ backgroundColor: "#081e4d", color: "#fff", px: 4, py: 3 }}>
          <Grid container justifyContent="space-between" alignItems="center">

            <Grid item xs={8} sx={{ display: "flex", gap: 3 }}>
              {company.logo_path && (
                <img
                  src={`${API}${company.logo_path}`}
                  alt="Logo"
                  style={{ height: 60 }}
                />
              )}
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {company.name}
                </Typography>
                <Typography>{company.address}</Typography>
                <Typography>Tel: {company.contact_number}</Typography>
                <Typography>{company.contact_email}</Typography>
              </Box>
            </Grid>

            <Grid item xs={4} sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 32, fontWeight: 800 }}>
                PAYSLIP
              </Typography>
              <Typography>Ref: {referenceNumber}</Typography>
              <Typography>Date: {formatDate(data.pay_date)}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* TABLE */}
        <Box sx={{ px: 3, py: 3 }}>
          <Table size="small">
            <TableBody>

              {/* EARNINGS */}
              <TableRow sx={{ backgroundColor: "#e6ecf8" }}>
                <TableCell sx={{ fontWeight: 700 }}>EARNINGS</TableCell>
                <TableCell />
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Amount
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Normal Pay</TableCell>
                <TableCell />
                <TableCell align="right">{money(normalPay)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Overtime 1.5x</TableCell>
                <TableCell />
                <TableCell align="right">{money(ot15Pay)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Overtime 2x</TableCell>
                <TableCell />
                <TableCell align="right">{money(ot20Pay)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={3} />
              </TableRow>

              {/* DEDUCTIONS */}
              <TableRow sx={{ backgroundColor: "#e6ecf8" }}>
                <TableCell sx={{ fontWeight: 700 }}>DEDUCTIONS</TableCell>
                <TableCell />
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Amount
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>UIF (1%)</TableCell>
                <TableCell />
                <TableCell align="right">{money(uif)}</TableCell>
              </TableRow>

              {payeEnabled && (
                <TableRow>
                  <TableCell>PAYE (Tax)</TableCell>
                  <TableCell />
                  <TableCell align="right">{money(tax)}</TableCell>
                </TableRow>
              )}

              {data.deductions?.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.description}</TableCell>
                  <TableCell />
                  <TableCell align="right">{money(d.amount)}</TableCell>
                </TableRow>
              ))}

              {/* Solid closing line */}
              <TableRow>
                <TableCell colSpan={3}
                  sx={{ borderBottom: "3px solid #000000" }}
                />
              </TableRow>

            </TableBody>
          </Table>
        </Box>

        {/* FINANCIAL SUMMARY */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "2px solid #081e4d",
            borderBottom: "2px solid #081e4d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Typography>
            Gross Pay: <strong>{money(gross)}</strong>
          </Typography>

          <Typography>
            Total Deductions: <strong>{money(totalDeductions)}</strong>
          </Typography>

          <Box sx={{
            backgroundColor: "#081e4d",
            color: "#fff",
            px: 3,
            py: 1
          }}>
            <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
              NET PAY {money(netPay)}
            </Typography>
          </Box>
        </Box>

      </Box>

      {/* DELETE DIALOG */}
      <Dialog open={showDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete this deduction?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payslip;