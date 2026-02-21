import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f4c81"
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff"
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280"
    }
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  shape: {
    borderRadius: 10
  }
});

export default theme;
