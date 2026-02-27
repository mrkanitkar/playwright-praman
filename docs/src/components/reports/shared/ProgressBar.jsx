import React from "react";
import { getStatusColor } from "./utils";

export const ProgressBar = ({ value, color, height = 10 }) => (
  <div style={{ background: "#f1f5f9", borderRadius: height / 2, height, width: "100%", overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(value, 100)}%`,
      height: "100%",
      background: color || getStatusColor(value),
      borderRadius: height / 2,
      transition: "width 0.5s ease",
    }} />
  </div>
);

export default ProgressBar;
