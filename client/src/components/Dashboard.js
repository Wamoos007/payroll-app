import React, { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import API from "../api";
import {
  Box,
  Typography,
  Button,
  Grid,
  MenuItem,
  Select,
  Paper
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

const money = v =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
  }).format(Number(v || 0));

function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [ytd, setYtd] = useState({
    employeeCount: 0,
    totalGross: 0,
    totalUif: 0,
    totalNet: 0
  });
  const [monthly, setMonthly] = useState([]);
  const fileInputRef = useRef();

  const loadData = useCallback(async () => {
    try {
      const ytdRes = await axios.get(`${API}/api/ytd/${year}`);
      const employees = Array.isArray(ytdRes.data) ? ytdRes.data : [];

      const totals = employees.reduce(
        (acc, employee) => {
          acc.totalGross += Number(employee.totalGross || 0);
          acc.totalUif += Number(employee.totalUif || 0);
          acc.totalNet += Number(employee.totalNet || 0);
          return acc;
        },
        {
          totalGross: 0,
          totalUif: 0,
          totalNet: 0
        }
      );

      setYtd({
        employeeCount: employees.length,
        ...totals
      });

      const monthlyRes = await axios.get(
        `${API}/api/payroll/monthly-summary/${year}`
      );

      const monthlyData = Array.isArray(monthlyRes.data)
        ? monthlyRes.data
        : [];

      const formattedMonths = Array.from({ length: 12 }, (_, i) => {
        const monthNumber = String(i + 1).padStart(2, "0");
        const found = monthlyData.find(m => m.month === monthNumber);

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
        employeeCount: 0,
        totalGross: 0,
        totalUif: 0,
        totalNet: 0
      });
      setMonthly([]);
    }
  }, [year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadBackup = async () => {
    const response = await axios.get(`${API}/api/backup`, {
      responseType: "blob"
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
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

    if (!window.confirm("Replace current database?")) return;

    const formData = new FormData();
    formData.append("backup", file);

    await axios.post(`${API}/api/restore`, formData);
    alert("Restore complete. Restart server.");
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(15,76,129,0.08), rgba(37,99,235,0.03))",
          border: "1px solid rgba(15,76,129,0.12)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Payroll Dashboard
            </Typography>
            <Typography color="text.secondary">
              Track payroll totals, monthly trends, and database backups from one place.
            </Typography>
          </Box>

          <Select
            value={year}
            onChange={e => setYear(e.target.value)}
            size="small"
            sx={{ minWidth: 120, backgroundColor: "#fff" }}
          >
            {[currentYear - 2, currentYear - 1, currentYear].map(y => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Employees with YTD data
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {ytd.employeeCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Gross YTD
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {money(ytd.totalGross)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              UIF YTD
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {money(ytd.totalUif)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Net YTD
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {money(ytd.totalNet)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ ...cardStyle, height: "100%" }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Monthly Payroll Overview
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              A month-by-month view of gross payroll for the selected year.
            </Typography>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={money} />
                <Bar dataKey="gross" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ ...cardStyle, height: "100%" }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Backup & Restore
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              Keep a local copy of the database before making changes.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={handleDownloadBackup}
              sx={{ mb: 1.5 }}
            >
              Create Backup
            </Button>

            <Button
              fullWidth
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
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography color="text.secondary" variant="body2">
          Tip: use the year selector to compare payroll patterns across periods.
        </Typography>
      </Box>
    </Box>
  );
}

const cardStyle = {
  backgroundColor: "#ffffff",
  p: 3,
  borderRadius: 3,
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
  border: "1px solid rgba(15,23,42,0.06)",
  height: "100%"
};

export default Dashboard;
