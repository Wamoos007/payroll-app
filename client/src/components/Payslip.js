import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

  const normalHours = Number(data.hours_wk1 ?? 0) + Number(data.hours_wk2 ?? 0);
  const rate = Number(data.rate_used ?? 0);
  const ot15 = Number(data.ot15_hours ?? 0);
  const ot20 = Number(data.ot20_hours ?? 0);

  const normalPay = normalHours * rate;
  const ot15Pay = ot15 * rate * 1.5;
  const ot20Pay = ot20 * rate * 2;

  const gross = normalPay + ot15Pay + ot20Pay;
  const uif = gross * 0.01;

  const manualDeductions =
    (data.deductions || []).reduce((sum, d) => sum + Number(d.amount ?? 0), 0);

  const totalDeductions = uif + manualDeductions;
  const netPay = gross - totalDeductions;

  const confirmDelete = async () => {
  if (!deleteId) return;

  try {
    await axios.delete(
      `${API}/api/payroll/deductions/${deleteId}`
    );

    setShowDeleteDialog(false);
    setDeleteId(null);

    await loadData(); // important
  } catch (err) {
    console.error("Delete deduction error:", err);
  }
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

  const fileName = `Payslip_${referenceNumber}.pdf`;

  html2pdf()
    .set({
      margin: 10,
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "landscape"
      }
    })
    .from(pdfRef.current)
    .save();
};
  const referenceNumber = `PS-${new Date(data.pay_date).getFullYear()}-${String(new Date(data.pay_date).getMonth()+1).padStart(2,"0")}-${String(data.id).padStart(4,"0")}`;
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={handleExport}>
          Download PDF
        </Button>
        <Button variant="outlined" onClick={() => setShowAdd(true)}>
          Add Deduction
        </Button>
      </Box>

      {showAdd && (
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <TextField size="small" label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <TextField size="small" label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          <Button variant="contained" onClick={addDeduction}>Save</Button>
          <Button onClick={() => setShowAdd(false)}>Cancel</Button>
        </Box>
      )}

      <Box
  ref={pdfRef}
  sx={{
    width: 820,
    mx: "auto",
    backgroundColor: "#ffffff",
    border: "1px solid #081e4d",
    fontFamily: "'Arial', sans-serif",
    fontSize: 12,
    color: "#111827"
  }}
>

  {/* HEADER BAR */}
<Box
  sx={{
    backgroundColor: "#081e4d",
    color: "#fff",
    px: 4,
    py: 3,
    position: "relative"
  }}
>
  <Grid container alignItems="center">

    {/* LEFT: LOGO + COMPANY */}
    <Grid
      item
      xs={8}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 3
      }}
    >
      {company.logo_path && (
        <Box
          sx={{
            height: 70,
            width: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          <img
            src={`${API}${company.logo_path}`}
            crossOrigin="anonymous"
            alt="Logo"
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain"
            }}
          />
        </Box>
      )}

      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          {company.name}
        </Typography>

        <Typography sx={{ fontSize: 12, opacity: 0.9 }}>
          {company.address}
        </Typography>

        <Typography sx={{ fontSize: 12, opacity: 0.9 }}>
          Tel: {company.contact_number}
        </Typography>

        <Typography sx={{ fontSize: 12, opacity: 0.9 }}>
          {company.contact_email}
        </Typography>
      </Box>
    </Grid>

    {/* RIGHT: PAYSLIP TITLE */}
    <Grid
      item
      xs={4}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-end",
        height: 70
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: 1
        }}
      >
        PAYSLIP
      </Typography>

      <Typography sx={{ fontSize: 12 }}>
        Ref: {referenceNumber}
      </Typography>

      <Typography sx={{ fontSize: 12 }}>
        Date: {formatDate(data.pay_date)}
      </Typography>
    </Grid>

  </Grid>

  {/* SUBTLE HIGHLIGHT STRIP */}
  <Box
    sx={{
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: 4,
      background: "linear-gradient(90deg,#1d4ed8,#3b82f6)"
    }}
  />
</Box>

  {/* EMPLOYER INFO STRIP */}
  <Box
    sx={{
      backgroundColor: "#f3f4f6",
      borderBottom: "1px solid #081e4d",
      px: 3,
      py: 1.5
    }}
  >
    <Grid container spacing={14}>
      <Grid item xs={4}>
        <strong>Company Reg:</strong> {company.registration_number || "-"}
      </Grid>
      <Grid item xs={4}>
        <strong>PAYE No:</strong> {company.paye_number || "-"}
      </Grid>
      <Grid item xs={4}>
        <strong>UIF No:</strong> {company.uif_number || "-"}
      </Grid>
    </Grid>
  </Box>

  {/* EMPLOYEE INFO */}
  <Box
    sx={{
      borderBottom: "1px solid #081e4d",
      px: 3,
      py: 2
    }}
  >
    <Grid container spacing={8}>
      <Grid item xs={3}>
        <strong>Name:</strong> {data.full_name}
      </Grid>
      <Grid item xs={3}>
        <strong>Emp Code:</strong> {data.employee_code}
      </Grid>
      <Grid item xs={3}>
        <strong>ID Number:</strong> {data.id_number}
      </Grid>
      <Grid item xs={3}>
        <strong>Pay Period:</strong>{" "}
        {formatDate(data.period_start)} – {formatDate(data.period_end)}
      </Grid>
    </Grid>
  </Box>

  {/* EARNINGS & DEDUCTIONS */}
  <Box sx={{ px: 3, py: 3 }}>

    <Table
      size="small"
      sx={{
        width: "100%",
        border: "1px solid #081e4d",
        "& td": {
          borderBottom: "1px solid #e5e7eb"
        }
      }}
    >
      <TableBody>

        {/* EARNINGS HEADER */}
        <TableRow sx={{ backgroundColor: "#e6ecf8" }}>
          <TableCell sx={{ fontWeight: 700, color: "#081e4d" }}>
            EARNINGS
          </TableCell>
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
          <TableCell>Overtime 1.5</TableCell>
          <TableCell />
          <TableCell align="right">{money(ot15Pay)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell>Overtime 2.0</TableCell>
          <TableCell />
          <TableCell align="right">{money(ot20Pay)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Total Earnings</TableCell>
          <TableCell />
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            {money(gross)}
          </TableCell>
        </TableRow>

        <TableRow>
          <TableCell colSpan={3} />
        </TableRow>

        {/* DEDUCTIONS HEADER */}
        <TableRow sx={{ backgroundColor: "#e6ecf8" }}>
          <TableCell sx={{ fontWeight: 700, color: "#081e4d" }}>
            DEDUCTIONS
          </TableCell>
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

        {data.deductions?.map((d) => (
  <TableRow
    key={d.id}
    sx={{
      "&:hover .delete-icon": {
        opacity: 1
      }
    }}
  >
    <TableCell>{d.description}</TableCell>

    <TableCell />

    <TableCell align="right">
      <Box
        sx={{
          position: "relative",
          display: "inline-block",
          width: "100%"
        }}
      >
        {money(d.amount)}

        <DeleteOutlineIcon
          className="delete-icon"
          onClick={() => {
            setDeleteId(d.id);
            setShowDeleteDialog(true);
          }}
          sx={{
            position: "absolute",
            top: -6,
            right: -6,
            fontSize: 18,
            color: "#dc2626",
            cursor: "pointer",
            opacity: 0,
            transition: "opacity 0.2s ease"
          }}
        />
      </Box>
    </TableCell>
  </TableRow>
))}

        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Total Deductions</TableCell>
          <TableCell />
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            {money(totalDeductions)}
          </TableCell>
        </TableRow>

        {/* NET PAY ROW */}
        <TableRow sx={{ backgroundColor: "#081e4d" }}>
          <TableCell sx={{ fontWeight: 700, color: "#fff" }}>
            NET PAY
          </TableCell>
          <TableCell />
          <TableCell align="right" sx={{ fontWeight: 800, color: "#fff" }}>
            {money(netPay)}
          </TableCell>
        </TableRow>

      </TableBody>
    </Table>
  </Box>

  {/* FOOTER */}
  <Box
    sx={{
      borderTop: "1px solid #081e4d",
      p: 2,
      fontSize: 10,
      backgroundColor: "#f9fafb"
    }}
  >
    This payslip is issued in accordance with the Basic Conditions of Employment Act and the Income Tax Act of South Africa.
    All statutory deductions including PAYE and UIF have been calculated in compliance with current legislation.
    This document serves as proof of income and tax deduction.
  </Box>

</Box>
      {/* DELETE DIALOG */}
      <Dialog
  open={showDeleteDialog}
  onClose={() => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  }}
>
  <DialogTitle sx={{ color: "#081e4d" }}>
    Confirm Deletion
  </DialogTitle>

  <DialogContent>
    <DialogContentText>
      Are you sure you want to delete this deduction?
    </DialogContentText>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => {
        setShowDeleteDialog(false);
        setDeleteId(null);
      }}
    >
      Cancel
    </Button>

    <Button
      onClick={confirmDelete}
      color="error"
      variant="contained"
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}

export default Payslip;