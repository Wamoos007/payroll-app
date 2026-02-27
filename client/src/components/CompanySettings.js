import SignatureCanvas from "react-signature-canvas";
import { useRef, useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Paper
} from "@mui/material";

const API = "http://localhost:3001";

export default function CompanySettings() {
  const sigPad = useRef(null);

  const [tab, setTab] = useState(0);

  const [company, setCompany] = useState({});
  const [testEmail, setTestEmail] = useState("");

  // General Settings (temporary local state)
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadCompany();
    loadSettings();
  }, []);
  const loadSettings = async () => {
  try {
    const res = await axios.get(`${API}/api/settings`);
    setSettings(res.data || {});
  } catch (err) {
    console.error("Load settings error:", err);
  }
};

  const loadCompany = async () => {
    try {
      const res = await axios.get(`${API}/api/company`);
      setCompany(res.data || {});
    } catch (err) {
      console.error("Load company error:", err);
    }
  };

  const handleChange = (e) => {
    setCompany({
      ...company,
      [e.target.name]: e.target.value
    });
  };

  const handleSwitch = (e) => {
  const { checked } = e.target;

  setCompany(prev => ({
    ...prev,
    smtp_secure: checked
  }));
};

  const handleSave = async () => {
    try {
      await axios.post(`${API}/api/company`, company);
      alert("Company saved successfully");
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed");
    }
  };

  const handleLogoUpload = async (e) => {
    const formData = new FormData();
    formData.append("logo", e.target.files[0]);

    try {
      const res = await axios.post(
        `${API}/api/company/upload-logo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setCompany(prev => ({
        ...prev,
        logo_path: res.data.logo_path
      }));
    } catch (err) {
      console.error("Logo upload error:", err);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter a test email address.");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/api/email/test`,
        { testEmail }
      );

      alert(`Email sent successfully!\nMessage ID: ${res.data.messageId}`);
    } catch (err) {
      alert("Test failed:\n" + (err.response?.data?.details || err.message));
    }
  };

  const handleSaveSignature = () => {
  if (!sigPad.current || sigPad.current.isEmpty()) {
    alert("Please sign before saving.");
    return;
  }

      const signature = sigPad.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      setCompany(prev => ({
        ...prev,
        signature_image: signature
      }));

      alert("Signature saved locally. Click 'Save Company' to persist.");
    };

//////////////////////////////////////////////////////
// 🔥 PASTE THE NEW FUNCTION RIGHT HERE 👇
//////////////////////////////////////////////////////

const handleSettingToggle = async (key, checked) => {
  console.log("Toggle clicked:", key, checked);
  try {
    await axios.put(
      `${API}/api/settings/${key}`,
      { value: checked ? "1" : "0" }
    );

    // update local state
    setSettings(prev => ({
      ...prev,
      [key]: checked ? "1" : "0"
    }));

  } catch (err) {
    console.error("Setting update failed:", err);
  }
};
//////////////////////////////////////////////////////

  return (
  <Box sx={{ p: 3, maxWidth: 1000 }}>
    <Typography variant="h5" sx={{ mb: 4 }}>
      System Settings
    </Typography>

    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Payroll Settings
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enable_paye === "1"}
                onChange={(e) =>
                  handleSettingToggle("enable_paye", e.target.checked)
                }
              />
            }
            label="Enable PAYE"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enable_uif === "1"}
                onChange={(e) =>
                  handleSettingToggle("enable_uif", e.target.checked)
                }
              />
            }
            label="Enable UIF"
          />
        </Grid>
      </Grid>
    </Paper>

    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Company Information
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Company Name" name="name"
            value={company.name || ""} onChange={handleChange} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Registration Number"
            name="registration_number"
            value={company.registration_number || ""}
            onChange={handleChange} />
        </Grid>

        <Grid item xs={12}>
          <TextField fullWidth label="Address"
            name="address"
            value={company.address || ""}
            onChange={handleChange} />
        </Grid>
      </Grid>
    </Paper>

    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        SMTP Configuration
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="SMTP Host"
            name="smtp_host"
            value={company.smtp_host || ""}
            onChange={handleChange} />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField fullWidth label="Port"
            name="smtp_port"
            value={company.smtp_port || ""}
            onChange={handleChange} />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={company.smtp_secure || false}
                onChange={handleSwitch}
              />
            }
            label="SSL"
          />
        </Grid>
      </Grid>
    </Paper>

    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Signature
      </Typography>

      <Box sx={{ border: "1px solid #ddd", borderRadius: 2 }}>
        <SignatureCanvas
          ref={sigPad}
          penColor="black"
          canvasProps={{
            width: 900,
            height: 150,
            style: { width: "100%" }
          }}
        />
      </Box>
    </Paper>

    <Box sx={{ textAlign: "right" }}>
      <Button variant="contained" onClick={handleSave}>
        Save All Settings
      </Button>
    </Box>
  </Box>

  );
}