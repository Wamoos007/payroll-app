import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function Payslip() {
  const { lineId } = useParams();
  const [line, setLine] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/payroll/lines/forPayslip/${lineId}`)
      .then((res) => {
        setLine(res.data);
      })
      .catch((err) => console.error(err));
  }, [lineId]);

  if (!line) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "600px", margin: "auto" }}>
      <h2>Payslip</h2>

      <div style={{ marginBottom: "8px" }}>
        <strong>Employee:</strong> {line.employee_code} - {line.full_name}
      </div>

      <div style={{ marginBottom: "8px" }}>
        <strong>Hours Wk1:</strong> {line.hours_wk1}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <strong>Hours Wk2:</strong> {line.hours_wk2}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <strong>Total hours:</strong> {line.normalHours}
      </div>

      <div style={{ marginBottom: "8px" }}>
        <strong>Gross:</strong> {line.gross.toFixed(2)}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <strong>UIF:</strong> {line.uif.toFixed(2)}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <strong>Net:</strong> {line.net.toFixed(2)}
      </div>

      <button
        onClick={() => window.print()}
        style={{
          marginTop: "20px",
          padding: "8px 16px",
          fontSize: "16px",
          cursor: "pointer"
        }}
      >
        Save / Print as PDF
      </button>
    </div>
  );
}

export default Payslip;
