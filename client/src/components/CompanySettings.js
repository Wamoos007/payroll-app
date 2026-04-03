import SignatureCanvas from "react-signature-canvas";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import API from "../api";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography
} from "@mui/material";

function getApiErrorMessage(err, fallback) {
  return err.response?.data?.error || err.response?.data?.message || err.message || fallback;
}

const sectionCard = {
  p: 3,
  borderRadius: 3,
  border: "1px solid rgba(15,76,129,0.10)",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.06)"
};

const statCard = {
  p: 2.5,
  borderRadius: 3,
  background: "linear-gradient(180deg, #ffffff, #f8fbff)",
  border: "1px solid rgba(15,76,129,0.08)"
};

export default function CompanySettings() {
  const sigPad = useRef(null);
  const logoInputRef = useRef(null);
  const [company, setCompany] = useState({});
  const [settings, setSettings] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadCompany = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/company`);
      setCompany(res.data || {});
    } catch (err) {
      console.error("Load company error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Could not load company details.")
      });
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/settings`);
      setSettings(res.data || {});
    } catch (err) {
      console.error("Load settings error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Could not load payroll settings.")
      });
    }
  }, []);

  useEffect(() => {
    loadCompany();
    loadSettings();
  }, [loadCompany, loadSettings]);

  const handleChange = e => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitch = e => {
    const { checked } = e.target;

    setCompany(prev => ({
      ...prev,
      smtp_secure: checked
    }));
  };

  const handleClearSignature = () => {
    sigPad.current?.clear();
  };

  const handleLogoUpload = async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append("logo", file);

      const res = await axios.post(`${API}/api/company/upload-logo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setCompany(prev => ({
        ...prev,
        logo_path: res.data.logo_path
      }));

      setStatus({
        type: "success",
        message: "Company logo uploaded. Save settings to keep it."
      });
    } catch (err) {
      console.error("Logo upload error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Logo upload failed.")
      });
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleRemoveSavedSignature = () => {
    setCompany(prev => ({
      ...prev,
      signature_image: ""
    }));

    setStatus({
      type: "info",
      message: "Saved signature will be removed the next time you save settings."
    });
  };

  const handleRemoveLogo = () => {
    setCompany(prev => ({
      ...prev,
      logo_path: ""
    }));

    setStatus({
      type: "info",
      message: "Saved logo will be removed the next time you save settings."
    });
  };

  const handleSave = async () => {
    try {
      if (!company.name?.trim()) {
        setStatus({
          type: "warning",
          message: "Company name is required before saving settings."
        });
        return;
      }

      setSaving(true);

      const nextCompany = {
        ...company,
        signature_image: sigPad.current && !sigPad.current.isEmpty()
          ? sigPad.current.toDataURL("image/png")
          : company.signature_image || null
      };

      await axios.post(`${API}/api/company`, nextCompany);
      setCompany(nextCompany);
      setStatus({
        type: "success",
        message: "Settings saved successfully."
      });
    } catch (err) {
      console.error("Save error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Save failed.")
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingToggle = async (key, checked) => {
    try {
      await axios.put(`${API}/api/settings/${key}`, {
        value: checked ? "1" : "0"
      });

      setSettings(prev => ({
        ...prev,
        [key]: checked ? "1" : "0"
      }));

      setStatus({
        type: "success",
        message: "Payroll setting updated."
      });
    } catch (err) {
      console.error("Setting update failed:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Failed to update payroll setting.")
      });
    }
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
              Company Settings
            </Typography>
            <Typography color="text.secondary">
              Manage payroll switches, company contact details, email delivery, and signing assets.
            </Typography>
          </Box>

          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Paper>

      {status.message ? (
        <Alert severity={status.type || "info"} sx={{ mb: 3 }}>
          {status.message}
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={statCard}>
            <Typography color="text.secondary" variant="body2">
              PAYE
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {settings.enable_paye === "1" ? "Enabled" : "Disabled"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={statCard}>
            <Typography color="text.secondary" variant="body2">
              UIF
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {settings.enable_uif === "1" ? "Enabled" : "Disabled"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={statCard}>
            <Typography color="text.secondary" variant="body2">
              Signature on file
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {company.signature_image ? "Saved" : "Not yet saved"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={statCard}>
            <Typography color="text.secondary" variant="body2">
              Company logo
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {company.logo_path ? "Uploaded" : "Not yet uploaded"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ ...sectionCard, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Payroll Controls
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
              Turn payroll features on or off without digging through the database.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 1.5
              }}
            >
              <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "#f8fbff" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_paye === "1"}
                      onChange={e =>
                        handleSettingToggle("enable_paye", e.target.checked)
                      }
                    />
                  }
                  label="Enable PAYE calculations"
                />
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "#f8fbff" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_uif === "1"}
                      onChange={e =>
                        handleSettingToggle("enable_uif", e.target.checked)
                      }
                    />
                  }
                  label="Enable UIF deductions"
                />
              </Paper>
            </Box>
          </Paper>

          <Paper sx={sectionCard}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Signature
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
              Draw the company signature used for payroll documents and email workflows.
            </Typography>

            {company.signature_image ? (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Current saved signature
                </Typography>
                <Box
                  component="img"
                  src={company.signature_image}
                  alt="Saved signature"
                  sx={{
                    width: "100%",
                    maxHeight: 120,
                    objectFit: "contain",
                    border: "1px solid rgba(15,76,129,0.12)",
                    borderRadius: 2,
                    backgroundColor: "#fff"
                  }}
                />
              </Box>
            ) : null}

            <Box
              sx={{
                border: "1px solid rgba(15,76,129,0.14)",
                borderRadius: 2,
                overflow: "hidden",
                background:
                  "linear-gradient(180deg, rgba(248,251,255,1), rgba(255,255,255,1))"
              }}
            >
              <SignatureCanvas
                ref={sigPad}
                penColor="#0f172a"
                canvasProps={{
                  width: 900,
                  height: 180,
                  style: { width: "100%", height: "180px" }
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={handleClearSignature}>
                Clear Pad
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={handleRemoveSavedSignature}
                disabled={!company.signature_image}
              >
                Remove Saved Signature
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper sx={{ ...sectionCard, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Company Information
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
              These details appear across documents, payroll records, and employee-facing outputs.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Company Logo
              </Typography>

              {company.logo_path ? (
                <Box
                  component="img"
                  src={`${API}${company.logo_path}`}
                  alt="Company logo"
                  sx={{
                    width: 140,
                    height: 140,
                    objectFit: "contain",
                    p: 1.5,
                    mb: 1.5,
                    border: "1px solid rgba(15,76,129,0.12)",
                    borderRadius: 2,
                    backgroundColor: "#fff"
                  }}
                />
              ) : (
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
                  No logo uploaded yet.
                </Typography>
              )}

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleLogoUpload}
              />

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? "Uploading..." : company.logo_path ? "Replace Logo" : "Upload Logo"}
                </Button>

                <Button
                  variant="text"
                  color="error"
                  disabled={!company.logo_path}
                  onClick={handleRemoveLogo}
                >
                  Remove Logo
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="name"
                  value={company.name || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  name="registration_number"
                  value={company.registration_number || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contact_email"
                  value={company.contact_email || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contact_number"
                  value={company.contact_number || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Address"
                  name="address"
                  value={company.address || ""}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={sectionCard}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              SMTP Configuration
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
              Email payslips and notifications directly from the app using your preferred mailbox.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  name="smtp_host"
                  value={company.smtp_host || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Port"
                  name="smtp_port"
                  value={company.smtp_port || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 2,
                    backgroundColor: "#f8fbff"
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(company.smtp_secure)}
                        onChange={handleSwitch}
                      />
                    }
                    label="Use SSL"
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  name="smtp_user"
                  value={company.smtp_user || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="SMTP Password"
                  name="smtp_pass"
                  value={company.smtp_pass || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Email Address"
                  name="smtp_from"
                  value={company.smtp_from || ""}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
