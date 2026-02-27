export const pct = (n, total) => total === 0 ? 0 : Math.round((n / total) * 100);
export const fmt = (n) => n.toLocaleString("en-US");
export const fmtCurrency = (n) => n === 0 ? "\u2014" : `\u20AC${(n / 1000000).toFixed(1)}M`;

export const getStatusColor = (readiness) => {
  if (readiness >= 95) return "#059669";
  if (readiness >= 85) return "#d97706";
  if (readiness >= 70) return "#ea580c";
  return "#dc2626";
};

export const getStatusBg = (readiness) => {
  if (readiness >= 95) return "#ecfdf5";
  if (readiness >= 85) return "#fffbeb";
  if (readiness >= 70) return "#fff7ed";
  return "#fef2f2";
};

export const getStatusLabel = (readiness) => {
  if (readiness >= 95) return "Ready";
  if (readiness >= 85) return "On Track";
  if (readiness >= 70) return "At Risk";
  return "Critical";
};

export const getSeverityColor = (s) => s === "high" ? "#dc2626" : s === "medium" ? "#d97706" : "#2563eb";
