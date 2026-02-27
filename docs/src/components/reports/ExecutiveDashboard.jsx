import React from "react";
import { PROCESS_DATA, WEEKLY_TREND } from "./data/processData";
import { pct, fmt, fmtCurrency, getStatusColor, getStatusBg, getStatusLabel } from "./shared/utils";
import { Card } from "./shared/Card";
import { MetricBox } from "./shared/MetricBox";
import { ProgressBar } from "./shared/ProgressBar";

export const ExecutiveDashboard = () => {
  const totalScenarios = PROCESS_DATA.reduce((s, p) => s + p.totalScenarios, 0);
  const totalPassed = PROCESS_DATA.reduce((s, p) => s + p.passed, 0);
  const totalFailed = PROCESS_DATA.reduce((s, p) => s + p.failed, 0);
  const totalBlocked = PROCESS_DATA.reduce((s, p) => s + p.blocked, 0);
  const overallReadiness = pct(totalPassed, totalScenarios);
  const totalRevRisk = PROCESS_DATA.reduce((s, p) => s + p.revenueAtRisk, 0);
  const totalUsers = PROCESS_DATA.reduce((s, p) => s + p.usersAffected, 0);
  const criticalIssues = PROCESS_DATA.reduce((s, p) => s + p.failureDetails.filter(f => f.severity === "high").length, 0);

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
        borderRadius: 12,
        padding: "24px 28px",
        color: "#fff",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>PROGRAMME ATLAS — ECC → S/4HANA TRANSFORMATION</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Steering Committee Quality Report</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Sprint 14 · Go-Live Target: 15 March 2026 · 16 days remaining</div>
          </div>
          <div style={{
            background: overallReadiness >= 90 ? "rgba(5,150,105,0.25)" : "rgba(234,179,8,0.25)",
            borderRadius: 10,
            padding: "12px 20px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, fontWeight: 900 }}>{overallReadiness}%</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>OVERALL READINESS</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Card>
          <MetricBox label="Business Processes" value={`${PROCESS_DATA.length}/${PROCESS_DATA.length}`} subtext="In scope" color="#1e40af" />
        </Card>
        <Card>
          <MetricBox label="Scenarios Validated" value={`${totalPassed}`} subtext={`of ${totalScenarios} total`} color="#059669" />
        </Card>
        <Card>
          <MetricBox label="Critical Blockers" value={criticalIssues} subtext="Need resolution" color={criticalIssues > 0 ? "#dc2626" : "#059669"} />
        </Card>
        <Card>
          <MetricBox label="Revenue Exposed" value={fmtCurrency(totalRevRisk)} subtext="If unresolved" color="#d97706" />
        </Card>
        <Card>
          <MetricBox label="Users Impacted" value={fmt(totalUsers)} subtext="Across all roles" color="#6366f1" />
        </Card>
      </div>

      {/* Process Readiness */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>Business Process Readiness</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                {["Process", "Owner", "Readiness", "", "Status", "Revenue Risk", "Open Issues"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROCESS_DATA.map(p => {
                const readiness = pct(p.passed, p.totalScenarios);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px", fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "10px", color: "#64748b" }}>{p.owner}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: getStatusColor(readiness) }}>{readiness}%</td>
                    <td style={{ padding: "10px", minWidth: 100 }}><ProgressBar value={readiness} /></td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        color: getStatusColor(readiness),
                        background: getStatusBg(readiness),
                      }}>
                        {getStatusLabel(readiness)}
                      </span>
                    </td>
                    <td style={{ padding: "10px", fontWeight: 600, color: p.revenueAtRisk > 0 ? "#d97706" : "#94a3b8" }}>{fmtCurrency(p.revenueAtRisk)}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ fontWeight: 700, color: p.failed > 0 ? "#dc2626" : "#059669" }}>{p.failed} failed</span>
                      {p.blocked > 0 && <span style={{ color: "#d97706", marginLeft: 6 }}>· {p.blocked} blocked</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trend */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Readiness Trend (8 Weeks)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
          {WEEKLY_TREND.map((w, i) => (
            <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: getStatusColor(w.readiness) }}>{w.readiness}%</span>
              <div style={{
                width: "100%",
                maxWidth: 40,
                height: `${w.readiness * 1.1}px`,
                background: i === WEEKLY_TREND.length - 1
                  ? "linear-gradient(180deg, #1e40af, #3b82f6)"
                  : `linear-gradient(180deg, ${getStatusColor(w.readiness)}88, ${getStatusColor(w.readiness)}44)`,
                borderRadius: 4,
              }} />
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{w.week}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Go/No-Go */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Go / No-Go Assessment</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { area: "Business Process Validation", status: overallReadiness >= 90 ? "GO" : "CONDITIONAL", detail: `${overallReadiness}% scenarios passing` },
            { area: "Data Migration Quality", status: "CONDITIONAL", detail: "BOM/Routing errors need resolution" },
            { area: "Integration Testing", status: "GO", detail: "All 14 interfaces validated" },
            { area: "Performance / Load", status: "GO", detail: "MRP run within SLA (<45 min)" },
            { area: "User Acceptance", status: "CONDITIONAL", detail: "3 critical defects in UAT" },
            { area: "Security & Authorization", status: "GO", detail: "All 48 roles validated" },
          ].map(item => (
            <div key={item.area} style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: item.status === "GO" ? "#ecfdf5" : item.status === "NO-GO" ? "#fef2f2" : "#fffbeb",
              border: `1px solid ${item.status === "GO" ? "#a7f3d0" : item.status === "NO-GO" ? "#fecaca" : "#fde68a"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.area}</span>
                <span style={{
                  fontWeight: 800,
                  fontSize: 12,
                  color: item.status === "GO" ? "#059669" : item.status === "NO-GO" ? "#dc2626" : "#d97706",
                }}>{item.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
