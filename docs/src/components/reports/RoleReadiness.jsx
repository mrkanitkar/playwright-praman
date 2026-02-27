import React from "react";
import { ROLE_READINESS } from "./data/processData";
import { pct, getStatusColor, getStatusBg, getStatusLabel } from "./shared/utils";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";

export const RoleReadiness = () => {
  const sorted = [...ROLE_READINESS].sort((a, b) => a.readiness - b.readiness);

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Day-1 Readiness by Business Role</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Can each role perform their daily work on Day 1 after go-live?
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                {["Role", "Process", "Users", "Critical Paths", "Readiness", "", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.role} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{r.role}</td>
                  <td style={{ padding: "10px", color: "#64748b" }}>{r.process}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{r.users}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{r.criticalPaths}</td>
                  <td style={{ padding: "10px", fontWeight: 700, color: getStatusColor(r.readiness) }}>{r.readiness}%</td>
                  <td style={{ padding: "10px", minWidth: 100 }}><ProgressBar value={r.readiness} /></td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      color: getStatusColor(r.readiness),
                      background: getStatusBg(r.readiness),
                    }}>
                      {getStatusLabel(r.readiness)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Impact Summary */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>User Impact Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { label: "Fully Ready (≥95%)", count: ROLE_READINESS.filter(r => r.readiness >= 95).reduce((s, r) => s + r.users, 0), total: ROLE_READINESS.reduce((s, r) => s + r.users, 0), color: "#059669" },
            { label: "On Track (85-94%)", count: ROLE_READINESS.filter(r => r.readiness >= 85 && r.readiness < 95).reduce((s, r) => s + r.users, 0), total: ROLE_READINESS.reduce((s, r) => s + r.users, 0), color: "#d97706" },
            { label: "At Risk (<85%)", count: ROLE_READINESS.filter(r => r.readiness < 85).reduce((s, r) => s + r.users, 0), total: ROLE_READINESS.reduce((s, r) => s + r.users, 0), color: "#dc2626" },
          ].map(item => (
            <div key={item.label} style={{ padding: 16, background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>users {item.label}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{pct(item.count, item.total)}% of total workforce</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RoleReadiness;
