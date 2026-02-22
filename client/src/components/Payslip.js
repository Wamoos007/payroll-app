import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import {
  Box,
  Typography,
  Divider,
  Button,
  Grid,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TextField
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
  const pdfRef = useRef(null);

  const loadData = async () => {
    const res1 = await axios.get(
      `${API}/api/payroll/lines/forPayslip/${lineId}`
    );
    const res2 = await axios.get(`${API}/api/company`);
    setData(res1.data);
    setCompany(res2.data);
  };

  useEffect(() => {
    loadData();
  }, [lineId]);

  if (!data || !company) return null;

  const normalHours =
    Number(data.hours_wk1 ?? 0) +
    Number(data.hours_wk2 ?? 0);

  const ot15 = Number(data.ot15_hours ?? 0);
  const ot20 = Number(data.ot20_hours ?? 0);
  const rate = Number(data.rate_used ?? 0);

  const normalPay = normalHours * rate;
  const ot15Pay = ot15 * rate * 1.5;
  const ot20Pay = ot20 * rate * 2;

  const gross = normalPay + ot15Pay + ot20Pay;
  const uif = gross * 0.01;

  const manualDeductions =
    (data.deductions || []).reduce(
      (sum, d) => sum + Number(d.amount ?? 0),
      0
    );

  const totalDeductions = uif + manualDeductions;
  const netPay = gross - totalDeductions;

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

    const safeName = (data.full_name || "Employee")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    const safeDate = formatDate(data.pay_date)
      .replace(/\s+/g, "-");

    const fileName = `Payslip_${safeName}_${safeDate}.pdf`;

    html2pdf()
      .set({
        margin: 12,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(pdfRef.current)
      .save();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={handleExport}>
          Download PDF
        </Button>

        <Button
          variant="outlined"
          onClick={() => setShowAdd(true)}
        >
          Add Deduction
        </Button>
      </Box>

      <Box
        id="payslip-content"
        ref={pdfRef}
        sx={{
          maxWidth: 820,
          mx: "auto",
          p: 5,
          backgroundColor: "#fff",
          borderRadius: 3,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb"
        }}
      >
        {/* HEADER */}
        <Grid container justifyContent="space-between">
          <Grid item xs={4}>
            {company.logo_path && (
              <img
                src={`${API}${company.logo_path}?t=${Date.now()}`}
                alt="Logo"
                style={{
                  maxHeight: 80,
                  maxWidth: "100%",
                  objectFit: "contain"
                }}
              />
            )}
          </Grid>

          <Grid item xs={8} textAlign="right">
            <Typography variant="h6" fontWeight={700}>
              {company.name}
            </Typography>
            <Typography variant="body2">
              {company.address}
            </Typography>
            <Typography variant="body2">
              Tel: {company.contact_number} | Email: {company.contact_email}
            </Typography>

            <Typography variant="h6" sx={{ mt: 2 }} fontWeight={700}>
              PAYSLIP
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* EMPLOYEE INFO */}
        <Box sx={{ mb: 4 }}>
          <Typography fontWeight={700} mb={2}>
            EMPLOYEE INFORMATION
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={6}>
              <Typography>Name</Typography>
              <Typography fontWeight={600}>
                {data.full_name}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Employee Code</Typography>
              <Typography fontWeight={600}>
                {data.employee_code}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Employee ID</Typography>
              <Typography fontWeight={600}>
                {data.id_number || "-"}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Pay Date</Typography>
              <Typography fontWeight={600}>
                {formatDate(data.pay_date)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Pay Period</Typography>
              <Typography fontWeight={600}>
                {formatDate(data.period_start)} — {formatDate(data.period_end)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* EARNINGS */}
        <Typography fontWeight={700} mb={2}>
          EARNINGS
        </Typography>

        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Normal Pay</TableCell>
              <TableCell align="right">{money(normalPay)}</TableCell>
            </TableRow>

            {ot15 > 0 && (
              <TableRow>
                <TableCell>Overtime 1.5</TableCell>
                <TableCell align="right">{money(ot15Pay)}</TableCell>
              </TableRow>
            )}

            {ot20 > 0 && (
              <TableRow>
                <TableCell>Overtime 2.0</TableCell>
                <TableCell align="right">{money(ot20Pay)}</TableCell>
              </TableRow>
            )}

            <TableRow>
              <TableCell><strong>Total Earnings</strong></TableCell>
              <TableCell align="right">
                <strong>{money(gross)}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider sx={{ my: 3 }} />

        {/* DEDUCTIONS */}
        <Typography fontWeight={700} mb={2}>
          DEDUCTIONS
        </Typography>

        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>UIF (1%)</TableCell>
              <TableCell align="right">{money(uif)}</TableCell>
            </TableRow>

            {data.deductions?.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.description}</TableCell>
                <TableCell align="right">{money(d.amount)}</TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell><strong>Total Deductions</strong></TableCell>
              <TableCell align="right">
                <strong>{money(totalDeductions)}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider sx={{ my: 3 }} />

        {/* FOOTER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mt: 6
          }}
        >
          {/* SIGNATURE */}
          <Box>
            {company.signature_image &&
              company.signature_image.startsWith("data:image") && (
                <img
                  src={company.signature_image}
                  alt="Signature"
                  style={{ height: 70 }}
                />
              )}

            <Box
              sx={{
                mt: 2,
                width: 220,
                borderTop: "1px solid #111827"
              }}
            />

            <Typography variant="caption">
              Authorized Signatory
            </Typography>
          </Box>

          {/* NET PAY BOX */}
          <Box
            sx={{
              backgroundColor: "#111827",
              color: "#fff",
              px: 5,
              py: 3,
              borderRadius: 3,
              minWidth: 280,
              textAlign: "right"
            }}
          >
            <Typography variant="subtitle2">
              NET PAY
            </Typography>

            <Typography variant="h4" fontWeight={700}>
              {money(netPay)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Payslip;