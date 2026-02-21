import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";

import {
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
const API = "http://localhost:3001";

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
      : "Payroll App");

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
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await axios.get(`${API}/api/version`);
        const currentVersion = require("../../package.json").version;

        if (res.data.version !== currentVersion) {
          setUpdateAvailable(true);
        }
      } catch {
        console.log("Version check skipped");
      }
    };

    checkVersion();
  }, []);

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
      <List>
  <ListItem disablePadding>
    <ListItemButton component={Link} to="/dashboard">
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
    <ListItemButton component={Link} to="/company">
      <ListItemText primary="Company Settings" />
    </ListItemButton>
  </ListItem>
</List>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#1f2937",
            color: "#ffffff"
          }
        }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700}>
            Payroll
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
            <ListItemButton component={Link} to="/company">
              <ListItemText primary="Company Settings" />
            </ListItemButton>
          </ListItem>
        </List>
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

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payruns" element={<PayRuns />} />
          <Route path="/enter-hours" element={<EnterHours />} />
          <Route path="/payslips" element={<PayslipList />} />
          <Route path="/payslip/:lineId" element={<Payslip />} />
          <Route path="/ytd" element={<YTD />} />
          <Route path="/company" element={<CompanySettings />} />
        </Routes>
      </Box>

      {/* UPDATE NOTICE */}
      <Snackbar
        open={updateAvailable}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="info" variant="filled">
          New version available. Please update.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
