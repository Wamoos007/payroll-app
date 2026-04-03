import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import API from "./api";
import SARS from "./components/SARS";
import {
  AlertTitle,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Toolbar,
  AppBar,
  CssBaseline,
  Divider,
  Snackbar,
  Alert
} from "@mui/material";

import Dashboard from "./components/Dashboard";
import Employees from "./components/Employees";
import PayRuns from "./components/PayRuns";
import EnterHours from "./components/EnterHours";
import PayslipList from "./components/PayslipList";
import Payslip from "./components/Payslip";
import YTD from "./components/YTD";
import CompanySettings from "./components/CompanySettings";

const drawerWidth = 240;

/* ===============================
   PAGE TITLE
================================= */
function PageTitle() {
  const location = useLocation();

  const titles = {
    "/": "Dashboard",
    "/employees": "Employees",
    "/payruns": "Pay Runs",
    "/enter-hours": "Enter Hours",
    "/payslips": "Payslips",
    "/ytd": "YTD Summary",
    "/company": "Company Settings"
  };

  const title =
    titles[location.pathname] ||
    (location.pathname.includes("/payslip/")
      ? "Payslip"
      : "Payroll");

  return (
    <Typography variant="h6" noWrap>
      {title}
    </Typography>
  );
}

/* ===============================
   APP
================================= */
function App() {
  const [updateAvailable] = useState(false);
  const [version, setVersion] = useState("");
  const [updateProgress, setUpdateProgress] = useState(null);
  const [session, setSession] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/session`);
      setSession(res.data);
    } catch (err) {
      console.error("Session check failed:", err);
    }
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await axios.get(`${API}/api/version`);
        const serverVersion = res.data.version;

        setVersion(serverVersion);

        // Optional: Compare against hardcoded minimum
        // For now we only show server version
      } catch {
        console.log("Version check skipped");
      }
    };

    checkVersion();
    loadSession();

    const intervalId = window.setInterval(loadSession, 15000);

    if (window.electronAPI) {
      window.electronAPI.onUpdateProgress((percent) => {
        setUpdateProgress(percent);
      });
    }

    return () => window.clearInterval(intervalId);
  }, [loadSession]);

  const isReadOnly = session?.accessMode === "read";
  const lockOwner = session?.lockOwner;

  const readOnlyMessage = lockOwner?.holderName
    ? `${lockOwner.holderName} currently has edit access for this database.`
    : "Another session currently has edit access for this database.";

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* TOP BAR */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: "#111827"
        }}
      >
        <Toolbar>
          <PageTitle />
        </Toolbar>
      </AppBar>

      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#1f2937",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column"
          }
  }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700}>
            AMIEM Payroll
          </Typography>
        </Toolbar>

        <Divider sx={{ borderColor: "#374151" }} />

        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/">
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/employees">
              <ListItemText primary="Employees" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/payruns">
              <ListItemText primary="Pay Runs" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/enter-hours">
              <ListItemText primary="Enter Hours" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/payslips">
              <ListItemText primary="Payslips" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/ytd">
              <ListItemText primary="YTD Summary" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/sars">
              <ListItemText primary="SARS" />
            </ListItemButton>
          </ListItem>
        </List>

        <ListItem disablePadding>
  <ListItemButton component={Link} to="/company">
    <ListItemText primary="Settings" />
  </ListItemButton>
</ListItem>

        {/* VERSION FOOTER */}
        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 1, borderColor: "#374151" }} />
          <Typography
            variant="caption"
            sx={{ opacity: 0.6 }}
          >
            Version {version || "—"}
          </Typography>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f3f4f6",
          p: 4,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: "100vh"
        }}
      >
        <Toolbar />

        {isReadOnly ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Read-only mode</AlertTitle>
            {readOnlyMessage} You can still view records, generate reports, and download payslips.
          </Alert>
        ) : null}

        <Routes>
          <Route path="/" element={<Dashboard readOnly={isReadOnly} />} />
          <Route path="/employees" element={<Employees readOnly={isReadOnly} />} />
          <Route path="/payruns" element={<PayRuns readOnly={isReadOnly} />} />
          <Route path="/enter-hours" element={<EnterHours readOnly={isReadOnly} />} />
          <Route path="/payslips" element={<PayslipList />} />
          <Route path="/payslip/:lineId" element={<Payslip readOnly={isReadOnly} />} />
          <Route path="/ytd" element={<YTD />} />
          <Route path="/company" element={<CompanySettings readOnly={isReadOnly} />} />
          <Route path="/sars" element={<SARS />} />
        </Routes>
      </Box>

      {/* UPDATE NOTICE (reserved for future auto-update system) */}
      <Snackbar
        open={updateAvailable}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="info" variant="filled">
          New version available. Please update.
        </Alert>
      </Snackbar>
      {updateProgress !== null && (
  <Box
    sx={{
      position: "fixed",
      bottom: 0,
      left: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      backgroundColor: "#e5e7eb",
      p: 1,
      zIndex: 2000
    }}
  >
    <Box
      sx={{
        height: 8,
        width: `${updateProgress}%`,
        backgroundColor: "#2563eb",
        transition: "width 0.3s ease"
      }}
    />
    <Typography variant="caption" align="center" display="block">
      Downloading update… {updateProgress}%
    </Typography>
  </Box>
)}
    </Box>
  );
}

export default App;
