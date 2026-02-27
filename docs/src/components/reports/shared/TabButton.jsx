import React from "react";

export const TabButton = ({ active, label, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 18px",
      border: "none",
      borderBottom: active ? "3px solid #1e40af" : "3px solid transparent",
      background: active ? "#eff6ff" : "transparent",
      color: active ? "#1e40af" : "#64748b",
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "all 0.15s ease",
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
  </button>
);

export default TabButton;
