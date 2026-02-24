import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  MenuItem,
  Select,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";

const API = "http://localhost:3001";

const money = v =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2
  }).format(Number(v || 0));

function YTD() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      const res = await axios.get(
        `${API}/api/ytd/${year}`
      );

      setData(res.data || []);
    } catch (err) {
      console.error("YTD load error:", err);
      setData([]);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Year-To-Date Summary
      </Typography>

      <Box sx={{ mb: 3 }}>
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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell align="right">Gross YTD</TableCell>
            <TableCell align="right">UIF YTD</TableCell>
            <TableCell align="right">Net YTD</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map(row => (
            <TableRow key={row.employee_id}>
              <TableCell>{row.full_name}</TableCell>
              <TableCell align="right">
                {money(row.totalGross)}
              </TableCell>
              <TableCell align="right">
                {money(row.totalUif)}
              </TableCell>
              <TableCell align="right">
                {money(row.totalNet)}
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

export default YTD;
