import React, { useState } from "react";
import { E2E_SCENARIOS } from "./data/e2eScenarios";
import { pct, fmt } from "./shared/utils";
import { Card } from "./shared/Card";

export const E2EQuality = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  const passing = E2E_SCENARIOS.filter(s => s.status === "pass").length;
  const warning = E2E_SCENARIOS.filter(s => s.status === "warning").length;
  const failing = E2E_SCENARIOS.filter(s => s.status === "fail").length;
  const critical = E2E_SCENARIOS.filter(s => s.criticality === "critical");
  const criticalPassing = critical.filter(s => s.status === "pass").length;
  const totalSystems = [...new Set(E2E_SCENARIOS.flatMap(s => s.steps.map(st => st.system)))].length;

  const statusConfig = {
    pass: { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669", badge: "PASS", headerBg: "linear-gradient(135deg, #064e3b, #047857)" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", badge: "WARNING", headerBg: "linear-gradient(135deg, #7c2d12, #c2410c)" },
    fail: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", badge: "FAIL", headerBg: "linear-gradient(135deg, #7f1d1d, #dc2626)" },
    "not-run": { bg: "#f1f5f9", border: "#cbd5e1", text: "#64748b", badge: "BLOCKED", headerBg: "#475569" },
  };

  const stepStatus = (s) => statusConfig[s] || statusConfig["not-run"];

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #581c87 0%, #7e22ce 50%, #a855f7 100%)",
        borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>CROSS-SYSTEM QUALITY</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>🔀 End-to-End Process Quality</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Business processes spanning SAP + {totalSystems} external systems · Interface chain validation · Data integrity verification</div>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 18, flexWrap: "wrap" }}>
          {[
            { label: "E2E Scenarios", value: E2E_SCENARIOS.length, sub: `${totalSystems} systems`, color: "#93c5fd" },
            { label: "Passing", value: passing, sub: `${pct(passing, E2E_SCENARIOS.length)}%`, color: "#4ade80" },
            { label: "Warning", value: warning, sub: "Degraded", color: "#fbbf24" },
            { label: "Failing", value: failing, sub: "Blocked", color: failing > 0 ? "#f87171" : "#4ade80" },
            { label: "Critical Flows", value: `${criticalPassing}/${critical.length}`, sub: "Passing", color: criticalPassing === critical.length ? "#4ade80" : "#f87171" },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{m.label}</div>
              <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Cards */}
      <div style={{ display: "grid", gap: 14 }}>
        {E2E_SCENARIOS.map(scenario => {
          const sc = statusConfig[scenario.status];
          const isExpanded = selectedScenario === scenario.id;
          const completedSteps = scenario.steps.filter(s => s.status === "pass" || s.status === "warning").length;
          const failedStep = scenario.steps.find(s => s.status === "fail");
          return (
            <div key={scenario.id}>
              {/* Card header */}
              <div onClick={() => setSelectedScenario(isExpanded ? null : scenario.id)} style={{
                padding: "16px 20px", borderRadius: isExpanded ? "12px 12px 0 0" : 12, cursor: "pointer",
                background: sc.bg, border: `1px solid ${sc.border}`,
                borderBottom: isExpanded ? "none" : `1px solid ${sc.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{scenario.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {scenario.id} · {scenario.steps.length} steps · {[...new Set(scenario.steps.map(s => s.system))].length} systems
                      {scenario.revenueAtRisk && <> · <strong style={{ color: sc.text }}>Impact: {scenario.revenueAtRisk}</strong></>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {scenario.e2eTime && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{scenario.e2eTime >= 60 ? `${(scenario.e2eTime / 60).toFixed(0)}m` : `${scenario.e2eTime}s`}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>E2E / {scenario.sla >= 60 ? `${(scenario.sla / 60).toFixed(0)}m` : `${scenario.sla}s`} SLA</div>
                      </div>
                    )}
                    {scenario.dataIntegrity !== undefined && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: scenario.dataIntegrity >= 99 ? "#059669" : "#d97706" }}>{scenario.dataIntegrity}%</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Data Integrity</div>
                      </div>
                    )}
                    <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 800, color: sc.text, border: `1px solid ${sc.text}40`, background: "#fff" }}>{sc.badge}</span>
                  </div>
                </div>

                {/* Progress pipeline */}
                <div style={{ display: "flex", gap: 2, marginTop: 10, alignItems: "center" }}>
                  {scenario.steps.map((step, i) => {
                    const ss = stepStatus(step.status);
                    return (
                      <React.Fragment key={i}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: ss.text, opacity: step.status === "not-run" ? 0.3 : 1 }} title={`${step.system}: ${step.action}`} />
                        {i < scenario.steps.length - 1 && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#94a3b8" }} />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#94a3b8" }}>
                  {scenario.steps.map((step, i) => <span key={i} style={{ flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.system}</span>)}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <Card style={{ borderRadius: "0 0 12px 12px", borderTop: "none", border: `1px solid ${sc.border}`, borderTopWidth: 0 }}>
                  {/* Step-by-step flow */}
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔀 Step-by-Step Flow</div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {scenario.steps.map((step, i) => {
                      const ss = stepStatus(step.status);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: step.status === "fail" ? "#fef2f208" : "#f8fafc", border: `1px solid ${step.status === "fail" ? "#fecaca" : "#f1f5f9"}` }}>
                          <span style={{ width: 24, height: 24, borderRadius: "50%", background: ss.text, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, opacity: step.status === "not-run" ? 0.4 : 1 }}>{step.seq}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: step.status === "not-run" ? "#94a3b8" : "#1e293b" }}>{step.action}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{step.system}{step.interface ? ` · ${step.interface}` : ""}</div>
                          </div>
                          {step.time > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{step.time >= 60 ? `${(step.time / 60).toFixed(0)}m` : `${step.time}s`}</span>}
                          <span style={{ padding: "2px 8px", borderRadius: 4, background: ss.bg, color: ss.text, fontSize: 10, fontWeight: 700 }}>{ss.badge}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Issues */}
                  {scenario.issues && scenario.issues.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>⚠️ Issues Detected</div>
                      {scenario.issues.map((issue, i) => (
                        <div key={i} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#991b1b" }}>🔴 {issue}</div>
                      ))}
                    </div>
                  )}

                  {/* Summary metrics */}
                  <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                    {[
                      { label: "Steps Completed", value: `${completedSteps}/${scenario.steps.length}` },
                      scenario.e2eTime ? { label: "E2E Time", value: `${scenario.e2eTime >= 60 ? (scenario.e2eTime/60).toFixed(0)+"m" : scenario.e2eTime+"s"} / ${scenario.sla >= 60 ? (scenario.sla/60).toFixed(0)+"m" : scenario.sla+"s"} SLA` } : null,
                      { label: "Data Integrity", value: scenario.dataIntegrity !== undefined ? `${scenario.dataIntegrity}%` : "N/A" },
                      { label: "Systems Traversed", value: [...new Set(scenario.steps.filter(s => s.status !== "not-run").map(s => s.system))].length },
                      failedStep ? { label: "Failed At", value: `Step ${failedStep.seq}: ${failedStep.system}` } : null,
                    ].filter(Boolean).map(m => (
                      <div key={m.label} style={{ padding: "8px 14px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>{m.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Go-Live Impact Summary */}
      <Card style={{ marginTop: 20, borderTop: "4px solid #7c3aed" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🚨 Go-Live Readiness: Cross-System Impact</div>
        <div style={{ display: "grid", gap: 6 }}>
          {E2E_SCENARIOS.filter(s => s.status !== "pass").map(s => {
            const sc = statusConfig[s.status];
            return (
              <div key={s.id} style={{ padding: "8px 12px", borderRadius: 6, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span><strong>{s.name}</strong> — <span style={{ color: sc.text }}>{sc.badge}</span></span>
                <span style={{ color: "#64748b" }}>{s.process} · {s.criticality} · Impact: <strong style={{ color: sc.text }}>{s.revenueAtRisk || "Operational"}</strong></span>
              </div>
            );
          })}
        </div>
        {failing > 0 && (
          <div style={{ marginTop: 10, padding: 12, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", fontSize: 12, color: "#991b1b" }}>
            <strong>{failing} end-to-end business flow{failing > 1 ? "s" : ""} completely blocked.</strong> These represent cross-system integration failures where downstream processes cannot execute. The SuccessFactors → S/4HANA HR flow affects 2,400 employees; the Concur → S/4HANA expense flow blocks €340K/month in reimbursements. Both require CPI flow remediation before go-live.
          </div>
        )}
      </Card>
    </div>
  );
};

export default E2EQuality;
