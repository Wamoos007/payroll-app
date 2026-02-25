import SignatureCanvas from "react-signature-canvas";
import { useRef, useEffect, useState } from "react";
import axios from "axios";
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
    setCompany({
      ...company,
      smtp_secure: e.target.checked
    });
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
    if (!sigPad.current) return;

    const canvas = sigPad.current.getCanvas();
    const signature = canvas.toDataURL("image/png");

    setCompany({
      ...company,
      signature_image: signature
    });
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
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="General Settings" />
          <Tab label="Company Settings" />
        </Tabs>
      </Paper>

      {/* ================= GENERAL SETTINGS TAB ================= */}
      {tab === 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Payroll System Settings
          </Typography>

          <FormControlLabel
  control={
    <Switch
      checked={settings.enable_paye === "1"}
      onChange={(e) =>
        handleSettingToggle("enable_paye", e.target.checked)
      }
    />
  }
  label="Enable PAYE Calculation"
/>

          <FormControlLabel
            control={
              <Switch
                checked={settings.enable_uif === "1"}
                onChange={(e) => handleSettingToggle("enable_uif", e.target.checked)}
              />
            }
            label="Enable UIF Calculation"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            Appearance
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.dark_mode === "1"}
                onChange={() => handleSettingToggle("dark_mode")}
              />
            }
            label="Dark Mode"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary">
            Note: These settings will be connected to the database in the next step.
          </Typography>
        </>
      )}

      {/* ================= COMPANY SETTINGS TAB ================= */}
      {tab === 1 && (
        <>
          <TextField
            fullWidth
            label="Company Name"
            name="name"
            value={company.name || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Registration Number"
            name="registration_number"
            value={company.registration_number || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Address"
            name="address"
            value={company.address || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Email"
            name="contact_email"
            value={company.contact_email || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Contact Number"
            name="contact_number"
            value={company.contact_number || ""}
            onChange={handleChange}
            margin="normal"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1">Company Logo</Typography>

          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            Upload Logo
            <input type="file" hidden onChange={handleLogoUpload} />
          </Button>

          {company.logo_path && (
            <Box sx={{ mt: 2 }}>
              <img
                src={`${API}${company.logo_path}`}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ height: 80, objectFit: "contain" }}
              />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1">Signature</Typography>

          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, mt: 2 }}>
            <SignatureCanvas
              ref={sigPad}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 150,
                style: { display: "block" }
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button onClick={() => sigPad.current.clear()}>
              Clear
            </Button>

            <Button variant="contained" onClick={handleSaveSignature}>
              Save Signature
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6">SMTP Settings</Typography>

          <TextField
            fullWidth
            label="SMTP Host"
            name="smtp_host"
            value={company.smtp_host || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="SMTP Port"
            name="smtp_port"
            value={company.smtp_port || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="SMTP Username"
            name="smtp_user"
            value={company.smtp_user || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="SMTP Password"
            name="smtp_pass"
            type="password"
            value={company.smtp_pass || ""}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="From Email"
            name="smtp_from"
            value={company.smtp_from || ""}
            onChange={handleChange}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Switch
                checked={company.smtp_secure || false}
                onChange={handleSwitch}
              />
            }
            label="Use SSL (Secure Connection)"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1">Send Test Email</Typography>

          <TextField
            fullWidth
            label="Test Email Address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            margin="normal"
          />

          <Button variant="outlined" onClick={handleTestEmail}>
            Send Test Email
          </Button>

          <Box sx={{ mt: 4 }}>
            <Button variant="contained" onClick={handleSave}>
              Save Company
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}