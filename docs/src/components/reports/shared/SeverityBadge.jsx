import React from "react";
import { getSeverityColor } from "./utils";

export const SeverityBadge = ({ severity }) => (
  <span style={{
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    background: getSeverityColor(severity),
  }}>
    {severity.toUpperCase()}
  </span>
);

export default SeverityBadge;
