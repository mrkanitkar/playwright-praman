import React from "react";
import { MIGRATION_DATA } from "./data/processData";
import { pct, fmt, getStatusColor } from "./shared/utils";
import { Card } from "./shared/Card";
import { MetricBox } from "./shared/MetricBox";
import { ProgressBar } from "./shared/ProgressBar";

export const DataMigration = () => {
  const totalRecords = MIGRATION_DATA.reduce((s, d) => s + d.records, 0);
  const totalValidated = MIGRATION_DATA.reduce((s, d) => s + d.validated, 0);
  const totalErrors = MIGRATION_DATA.reduce((s, d) => s + d.errors, 0);
  const totalCritical = MIGRATION_DATA.reduce((s, d) => s + d.critical, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Card><MetricBox label="Total Records" value={fmt(totalRecords)} color="#1e40af" /></Card>
        <Card><MetricBox label="Validated" value={fmt(totalValidated)} subtext={`${pct(totalValidated, totalRecords)}%`} color="#059669" /></Card>
        <Card><MetricBox label="Errors Found" value={fmt(totalErrors)} color="#d97706" /></Card>
        <Card><MetricBox label="Critical Errors" value={fmt(totalCritical)} color="#dc2626" /></Card>
      </div>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Data Migration Validation by Entity</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                {["Data Entity", "Records", "Validated", "Accuracy", "", "Errors", "Critical", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MIGRATION_DATA.map(d => {
                const accuracy = pct(d.validated - d.errors, d.records);
                return (
                  <tr key={d.entity} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px", fontWeight: 600 }}>{d.entity}</td>
                    <td style={{ padding: "10px" }}>{fmt(d.records)}</td>
                    <td style={{ padding: "10px" }}>{fmt(d.validated)}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: getStatusColor(accuracy) }}>{accuracy}%</td>
                    <td style={{ padding: "10px", minWidth: 80 }}><ProgressBar value={accuracy} height={8} /></td>
                    <td style={{ padding: "10px", color: d.errors > 0 ? "#d97706" : "#94a3b8" }}>{fmt(d.errors)}</td>
                    <td style={{ padding: "10px", color: d.critical > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.critical > 0 ? 700 : 400 }}>{d.critical}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        color: d.status === "good" ? "#059669" : d.status === "warning" ? "#d97706" : "#dc2626",
                        background: d.status === "good" ? "#ecfdf5" : d.status === "warning" ? "#fffbeb" : "#fef2f2",
                      }}>
                        {d.status === "good" ? "Clean" : d.status === "warning" ? "Review" : "Action Needed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DataMigration;
