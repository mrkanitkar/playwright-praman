import React, { useState } from "react";
import { ACCESSIBILITY_DATA } from "./data/accessibilityData";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";

export const AccessibilityReport = () => {
  const [view, setView] = useState("overview");
  const [selectedModule, setSelectedModule] = useState(null);

  const d = ACCESSIBILITY_DATA;
  const totalViolations = d.apps.reduce((s, a) => s + a.violations, 0);
  const criticalCount = d.apps.reduce((s, a) => s + a.critical, 0);
  const seriousCount = d.apps.reduce((s, a) => s + a.serious, 0);
  const srPass = d.apps.filter(a => a.screenReader === "pass").length;
  const kbPass = d.apps.filter(a => a.keyboard === "pass").length;
  const appsCompliant = d.apps.filter(a => a.score >= 80 && a.critical === 0).length;

  const getScoreColor = (score) => {
    if (score >= 90) return { bg: "#dcfce7", text: "#15803d", label: "AA Compliant" };
    if (score >= 80) return { bg: "#ecfdf5", text: "#059669", label: "Near Compliant" };
    if (score >= 70) return { bg: "#fffbeb", text: "#d97706", label: "Needs Work" };
    if (score >= 60) return { bg: "#fff7ed", text: "#ea580c", label: "Non-Compliant" };
    return { bg: "#fef2f2", text: "#dc2626", label: "Critical" };
  };

  const srIcon = (status) => status === "pass" ? "✅" : status === "partial" ? "⚠️" : "🔴";

  const filteredApps = selectedModule ? d.apps.filter(a => a.module === selectedModule) : d.apps;
  const modules = [...new Set(d.apps.map(a => a.module))];

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)",
        borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>ACCESSIBILITY INTELLIGENCE</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>♿ WCAG 2.1 AA Compliance Assessment</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Automated via {d.scanner} · {d.totalApps} Fiori apps scanned · Keyboard, screen reader & color contrast validation</div>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 18, flexWrap: "wrap" }}>
          {[
            { label: "Overall Score", value: `${d.overallScore}%`, sub: `Target: 85%+`, color: d.overallScore >= 85 ? "#4ade80" : "#fbbf24" },
            { label: "Apps Compliant", value: `${appsCompliant}/${d.totalApps}`, sub: "Score ≥80, 0 critical", color: appsCompliant > d.totalApps * 0.7 ? "#4ade80" : "#fbbf24" },
            { label: "Total Violations", value: totalViolations, sub: `${criticalCount} critical`, color: criticalCount > 0 ? "#f87171" : "#fbbf24" },
            { label: "Screen Reader", value: `${srPass}/${d.totalApps}`, sub: "Pass rate", color: srPass > d.totalApps * 0.7 ? "#4ade80" : "#f87171" },
            { label: "Keyboard Nav", value: `${kbPass}/${d.totalApps}`, sub: "Pass rate", color: kbPass > d.totalApps * 0.7 ? "#4ade80" : "#f87171" },
            { label: "Critical Issues", value: criticalCount, sub: `${seriousCount} serious`, color: criticalCount > 0 ? "#f87171" : "#4ade80" },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{m.label}</div>
              <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "♿ Principle Scores" },
          { id: "apps", label: "📋 App-by-App Audit" },
          { id: "violations", label: "🔍 Violations by Rule" },
          { id: "regulatory", label: "⚖️ Regulatory Compliance" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: view === v.id ? "2px solid #4338ca" : "1px solid #e2e8f0",
            background: view === v.id ? "#eef2ff" : "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: view === v.id ? 700 : 500,
          }}>{v.label}</button>
        ))}
      </div>

      {/* === PRINCIPLE SCORES === */}
      {view === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
            {d.principles.map(p => {
              const sc = getScoreColor(p.score);
              return (
                <Card key={p.id} style={{ borderLeft: `4px solid ${sc.text}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.icon} {p.name}</div>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", margin: "4px 0 8px" }}>{p.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: sc.text }}>{p.score}%</div>
                    <div style={{ flex: 1 }}><ProgressBar value={p.score} color={sc.text} height={8} /></div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.violations} violations</div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick issue summary */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🎯 Top Accessibility Gaps (Sorted by Impact)</div>
            {d.violationsByType.filter(v => v.severity === "critical" || v.severity === "serious").slice(0, 6).map((v, i) => {
              const sc = v.severity === "critical" ? { bg: "#fef2f2", border: "#fecaca", icon: "🔴" } : { bg: "#fffbeb", border: "#fde68a", icon: "⚠️" };
              return (
                <div key={i} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 6, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span>{sc.icon}</span>
                  <div><strong>{v.rule}</strong> ({v.count} instances) — {v.fix}</div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* === APP-BY-APP AUDIT === */}
      {view === "apps" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedModule(null)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: !selectedModule ? "2px solid #4338ca" : "1px solid #e2e8f0", background: !selectedModule ? "#eef2ff" : "#fff", fontWeight: !selectedModule ? 700 : 400 }}>All Modules</button>
            {modules.map(m => (
              <button key={m} onClick={() => setSelectedModule(m)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: selectedModule === m ? "2px solid #4338ca" : "1px solid #e2e8f0", background: selectedModule === m ? "#eef2ff" : "#fff", fontWeight: selectedModule === m ? 700 : 400 }}>{m}</button>
            ))}
          </div>
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  {["Fiori App", "Module", "Score", "Violations", "Critical", "Serious", "Screen Reader", "Keyboard", "Status"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", fontWeight: 600, color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filteredApps].sort((a, b) => a.score - b.score).map(app => {
                  const sc = getScoreColor(app.score);
                  return (
                    <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 8px" }}>
                        <div style={{ fontWeight: 600 }}>{app.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{app.fioriId}</div>
                      </td>
                      <td style={{ padding: "8px 8px" }}><code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>{app.module}</code></td>
                      <td style={{ padding: "8px 8px" }}><span style={{ padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text, fontWeight: 700 }}>{app.score}%</span></td>
                      <td style={{ padding: "8px 8px", fontWeight: 600 }}>{app.violations}</td>
                      <td style={{ padding: "8px 8px", color: app.critical > 0 ? "#dc2626" : "#059669", fontWeight: 700 }}>{app.critical}</td>
                      <td style={{ padding: "8px 8px", color: app.serious > 0 ? "#d97706" : "#059669" }}>{app.serious}</td>
                      <td style={{ padding: "8px 8px" }}>{srIcon(app.screenReader)} <span style={{ fontSize: 10 }}>{app.screenReader}</span></td>
                      <td style={{ padding: "8px 8px" }}>{srIcon(app.keyboard)} <span style={{ fontSize: 10 }}>{app.keyboard}</span></td>
                      <td style={{ padding: "8px 8px" }}><span style={{ padding: "2px 6px", borderRadius: 4, background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 600 }}>{sc.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Detail: issues per worst apps */}
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700 }}>Detailed Issues — Lowest Scoring Apps</div>
          {filteredApps.filter(a => a.score < 75).sort((a, b) => a.score - b.score).slice(0, 4).map(app => {
            const sc = getScoreColor(app.score);
            return (
              <Card key={app.id} style={{ marginTop: 8, borderLeft: `4px solid ${sc.text}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{app.name} <span style={{ fontSize: 10, color: "#94a3b8" }}>({app.fioriId} · {app.module})</span> — <span style={{ color: sc.text }}>{app.score}%</span></div>
                {app.issues.map((issue, i) => (
                  <div key={i} style={{ padding: "4px 0 4px 14px", borderLeft: `2px solid ${issue.includes("critical") ? "#fecaca" : "#fde68a"}`, fontSize: 12, color: "#334155", marginBottom: 3 }}>{issue}</div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* === VIOLATIONS BY RULE === */}
      {view === "violations" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🔍 Violations by WCAG Rule</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                {["Rule", "Count", "Severity", "WCAG Principle", "Remediation"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", fontWeight: 600, color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...d.violationsByType].sort((a, b) => {
                const sev = { critical: 0, serious: 1, moderate: 2 };
                return (sev[a.severity] || 3) - (sev[b.severity] || 3);
              }).map((v, i) => {
                const sevColor = v.severity === "critical" ? "#dc2626" : v.severity === "serious" ? "#d97706" : "#3b82f6";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 8px" }}><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 3, fontWeight: 600 }}>{v.rule}</code></td>
                    <td style={{ padding: "8px 8px", fontWeight: 700 }}>{v.count}</td>
                    <td style={{ padding: "8px 8px" }}><span style={{ padding: "2px 6px", borderRadius: 4, background: `${sevColor}15`, color: sevColor, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{v.severity}</span></td>
                    <td style={{ padding: "8px 8px", fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{v.principle}</td>
                    <td style={{ padding: "8px 8px", fontSize: 11, color: "#475569", maxWidth: 400 }}>{v.fix}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* === REGULATORY COMPLIANCE === */}
      {view === "regulatory" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⚖️ Regulatory Accessibility Requirements</div>
            <div style={{ display: "grid", gap: 10 }}>
              {d.regulatoryRequirements.map((r, i) => {
                const sc = r.status === "non-compliant" ? { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", badge: "NON-COMPLIANT" } : r.status === "partial" ? { bg: "#fffbeb", border: "#fde68a", text: "#d97706", badge: "PARTIAL" } : { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669", badge: "COMPLIANT" };
                return (
                  <div key={i} style={{ padding: 14, borderRadius: 8, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>🏛 {r.region} — {r.law}</div>
                      <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 800, color: sc.text, border: `1px solid ${sc.text}40` }}>{sc.badge}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>Deadline: <strong>{r.deadline}</strong> · {r.gaps} gap{r.gaps !== 1 ? "s" : ""} identified</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.impact}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🚨 Go-Live Risk Assessment</div>
            <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#991b1b" }}>
              <strong>European Accessibility Act (EAA) enforcement began June 2025.</strong> Current score of {d.overallScore}% with {criticalCount} critical violations means EU subsidiaries are exposed to enforcement action. {d.apps.filter(a => a.critical > 0).length} Fiori apps have critical WCAG failures that must be remediated before production rollout to EU countries.
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 12, color: "#92400e", marginTop: 8 }}>
              <strong>Section 508 exposure (US):</strong> {d.apps.filter(a => a.screenReader === "fail").length} apps fail screen reader testing. Any US federal employee or contractor using these apps creates ADA litigation risk.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccessibilityReport;
