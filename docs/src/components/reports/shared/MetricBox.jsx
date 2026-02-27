import React from "react";

export const MetricBox = ({ label, value, subtext, color }) => (
  <div style={{ textAlign: "center", padding: "12px 8px" }}>
    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || "#1e293b" }}>{value}</div>
    {subtext && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{subtext}</div>}
  </div>
);

export default MetricBox;
