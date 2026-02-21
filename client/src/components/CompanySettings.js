import React, { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider
} from "@mui/material";

const API = "http://localhost:3001";

export default function CompanySettings() {
  const sigPad = useRef(null);

  const [company, setCompany] = useState({
    name: "",
    registration_number: "",
    address: "",
    contact_email: "",
    contact_number: "",
    logo_path: "",
    signature_image: ""
  });

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const res = await axios.get(`${API}/api/company`);
      if (res.data) {
        setCompany(res.data);
      }
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

  const handleSave = async () => {
    try {
      await axios.post(`${API}/api/company`, company);
      alert("Company saved successfully");
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleLogoUpload = async (e) => {
    const formData = new FormData();
    formData.append("logo", e.target.files[0]);

    try {
      const res = await axios.post(
        `${API}/api/company/upload-logo`,
        formData
      );

      setCompany({
        ...company,
        logo_path: res.data.logo_path
      });
    } catch (err) {
      console.error("Logo upload error:", err);
    }
  };

  const saveSignature = () => {
  if (!sigPad.current) return;

  const canvas = sigPad.current.getCanvas();

  const signature = canvas.toDataURL("image/png");

  setCompany({
    ...company,
    signature_image: signature
  });
};

  const clearSignature = () => {
    sigPad.current.clear();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 700 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Company Settings
      </Typography>

      <TextField
        fullWidth
        label="Company Name"
        name="name"
        value={company.name}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Registration Number"
        name="registration_number"
        value={company.registration_number}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Address"
        name="address"
        value={company.address}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Email"
        name="contact_email"
        value={company.contact_email}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Contact Number"
        name="contact_number"
        value={company.contact_number}
        onChange={handleChange}
        margin="normal"
      />

      <Divider sx={{ my: 3 }} />

      {/* LOGO SECTION */}
      <Typography variant="subtitle1">Company Logo</Typography>

      <Button variant="outlined" component="label" sx={{ mt: 1 }}>
        Upload Logo
        <input type="file" hidden onChange={handleLogoUpload} />
      </Button>

      {company.logo_path && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              backgroundColor: "#fafafa",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 120
            }}
          >
            <img
              src={`${API}${company.logo_path}?t=${Date.now()}`}
              alt="Logo"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain"
              }}
            />
          </Box>
        )}
      <Divider sx={{ my: 3 }} />

      {/* SIGNATURE PAD SECTION */}
      <Typography variant="subtitle1">Signature</Typography>

      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 2,
          mt: 2,
          backgroundColor: "#fff"
        }}
      >
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
        <Button variant="outlined" onClick={clearSignature}>
          Clear
        </Button>

        <Button variant="contained" onClick={saveSignature}>
          Save Signature
        </Button>
      </Box>

      {company.signature_image && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="green">
            Signature saved
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Company
        </Button>
      </Box>
    </Box>
  );
}