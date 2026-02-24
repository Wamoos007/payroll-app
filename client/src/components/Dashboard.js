import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Grid,
  MenuItem,
  Select
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const API = "http://localhost:3001";

const money = v =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
  }).format(Number(v || 0));

function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [ytd, setYtd] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    loadData();
  }, [year]);

  /* ================================
     SAFE DATA LOADER (FIXED)
  ================================= */
  const loadData = async () => {
  try {
    /* -------- YTD -------- */
    const ytdRes = await axios.get(`${API}/api/ytd/${year}`);

const employees = Array.isArray(ytdRes.data)
  ? ytdRes.data
  : [];

const totalGross = employees.reduce(
  (sum, e) => sum + Number(e.totalGross || 0),
  0
);

const totalUif = employees.reduce(
  (sum, e) => sum + Number(e.totalUif || 0),
  0
);

const totalNet = employees.reduce(
  (sum, e) => sum + Number(e.totalNet || 0),
  0
);

setYtd({
  totalGross,
  totalUif,
  totalNet
});

    /* -------- MONTHLY -------- */
    const monthlyRes = await axios.get(
      `${API}/api/payroll/monthly-summary/${year}`
    );

    const monthlyData = Array.isArray(monthlyRes.data)
      ? monthlyRes.data
      : [];

    const formattedMonths = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = String(i + 1).padStart(2, "0");

      const found = monthlyData.find(
        m => m.month === monthNumber
      );

      return {
        name: new Date(0, i).toLocaleString("default", {
          month: "short"
        }),
        gross: found ? Number(found.totalGross) : 0
      };
    });

    setMonthly(formattedMonths);

  } catch (err) {
    console.error("Dashboard load error:", err);

    setYtd({
      totalGross: 0,
      totalUif: 0,
      totalNet: 0
    });

    setMonthly([]);
  }
};

  /* ================================
     BACKUP
  ================================= */
  const handleDownloadBackup = async () => {
    const response = await axios.get(
      `${API}/api/backup`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "payroll-backup.db");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleRestoreClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelected = async e => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("Replace current database?"))
      return;

    const formData = new FormData();
    formData.append("backup", file);

    await axios.post(`${API}/api/restore`, formData);
    alert("Restore complete. Restart server.");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Payroll Dashboard
      </Typography>

      {/* YEAR SELECTOR */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Select
          value={year}
          onChange={e => setYear(e.target.value)}
          size="small"
        >
          {[currentYear - 2, currentYear - 1, currentYear].map(y => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* BACKUP SECTION */}
      <Box
        sx={{
          backgroundColor: "#ffffff",
          p: 3,
          borderRadius: 2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          mb: 4
        }}
      >
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          System Backup
        </Typography>

        <Button
          variant="contained"
          onClick={handleDownloadBackup}
          sx={{ mr: 2 }}
        >
          Create Backup
        </Button>

        <Button
          variant="outlined"
          onClick={handleRestoreClick}
        >
          Restore Backup
        </Button>

        <input
          type="file"
          accept=".db"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
      </Box>

      {/* YTD CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={4}>
          <Box sx={cardStyle}>
            <Typography>Total Gross YTD</Typography>
            <Typography variant="h6" fontWeight={700}>
              {money(ytd?.totalGross)}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <Box sx={cardStyle}>
            <Typography>Total UIF YTD</Typography>
            <Typography variant="h6" fontWeight={700}>
              {money(ytd?.totalUif)}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <Box sx={cardStyle}>
            <Typography>Total Net YTD</Typography>
            <Typography variant="h6" fontWeight={700}>
              {money(ytd?.totalNet)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* MONTHLY GRAPH */}
      <Box sx={{ ...cardStyle }}>
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          Monthly Payroll Overview
        </Typography>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={money} />
            <Bar dataKey="gross" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

const cardStyle = {
  backgroundColor: "#ffffff",
  p: 3,
  borderRadius: 2,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
};

export default Dashboard;
