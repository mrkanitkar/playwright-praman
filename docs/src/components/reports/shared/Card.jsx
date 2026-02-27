import React from "react";

export const Card = ({ children, style }) => (
  <div style={{
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 20,
    ...style,
  }}>
    {children}
  </div>
);

export default Card;
