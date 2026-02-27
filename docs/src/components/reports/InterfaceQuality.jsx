import React, { useState } from "react";
import { INTERFACE_DATA } from "./data/interfaceData";
import { pct, fmt } from "./shared/utils";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";

export const InterfaceQuality = () => {
  const [view, setView] = useState("systems");
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const d = INTERFACE_DATA;
  const tested = d.interfaces.filter(i => i.status !== "not-tested");
  const passing = tested.filter(i => i.status === "pass").length;
  const warning = tested.filter(i => i.status === "warning").length;
  const failing = tested.filter(i => i.status === "fail").length;
  const totalVolume = d.interfaces.reduce((s, i) => s + i.dailyVolume, 0);
  const avgLatency = (tested.filter(i => i.avgLatency > 0).reduce((s, i) => s + i.avgLatency, 0) / tested.filter(i => i.avgLatency > 0).length).toFixed(1);
  const avgErrorRate = (tested.reduce((s, i) => s + i.errorRate, 0) / tested.length).toFixed(2);
  const criticalFailing = d.interfaces.filter(i => i.status === "fail" && (i.criticality === "critical" || i.criticality === "high"));

  const statusCfg = {
    pass: { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669", badge: "PASS" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", badge: "WARNING" },
    fail: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", badge: "FAIL" },
    "not-tested": { bg: "#f1f5f9", border: "#cbd5e1", text: "#64748b", badge: "NOT TESTED" },
  };

  const sysStatusCfg = {
    healthy: { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669", dot: "#22c55e", label: "HEALTHY" },
    degraded: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", dot: "#eab308", label: "DEGRADED" },
    warning: { bg: "#fff7ed", border: "#fed7aa", text: "#ea580c", dot: "#f97316", label: "WARNING" },
    failing: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", dot: "#ef4444", label: "FAILING" },
  };

  const critColor = (c) => c === "critical" ? "#dc2626" : c === "high" ? "#ea580c" : c === "medium" ? "#d97706" : "#64748b";

  let filteredInterfaces = d.interfaces;
  if (filterType) filteredInterfaces = filteredInterfaces.filter(i => i.type === filterType);
  if (filterStatus) filteredInterfaces = filteredInterfaces.filter(i => i.status === filterStatus);

  const latestStability = d.stabilityHistory[d.stabilityHistory.length - 1];
  const prevStability = d.stabilityHistory[d.stabilityHistory.length - 2];
  const stabilityTrend = latestStability.totalDown > prevStability.totalDown ? "worsening" : latestStability.totalDown < prevStability.totalDown ? "improving" : "stable";

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0284c7 100%)",
        borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>INTEGRATION QUALITY</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>🔗 Interface & Integration Testing</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{d.totalInterfaces} interfaces · {d.thirdPartySystems.length} third-party systems · IDoc, RFC, OData, CPI, EDI, File, REST · Tested via Playwright + SAP CPI monitoring</div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 18, flexWrap: "wrap" }}>
          {[
            { label: "Total Interfaces", value: d.totalInterfaces, sub: `${d.totalActive} active`, color: "#93c5fd" },
            { label: "Tested", value: `${d.totalTested}/${d.totalActive}`, sub: `${pct(d.totalTested, d.totalActive)}% coverage`, color: "#4ade80" },
            { label: "Passing", value: passing, sub: `${pct(passing, tested.length)}%`, color: "#4ade80" },
            { label: "Warnings", value: warning, sub: "Degraded", color: "#fbbf24" },
            { label: "Failing", value: failing, sub: `${criticalFailing.length} critical/high`, color: failing > 0 ? "#f87171" : "#4ade80" },
            { label: "3rd Party Systems", value: d.thirdPartySystems.length, sub: `${d.thirdPartySystems.filter(s => s.status === "failing").length} down`, color: d.thirdPartySystems.some(s => s.status === "failing") ? "#f87171" : "#4ade80" },
            { label: "Daily Volume", value: fmt(totalVolume), sub: "Messages/day", color: "#93c5fd" },
            { label: "Avg Error Rate", value: `${avgErrorRate}%`, sub: "Across all", color: parseFloat(avgErrorRate) > 1 ? "#fbbf24" : "#4ade80" },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{m.label}</div>
              <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "systems", label: "🏢 Third-Party Systems" },
          { id: "overview", label: "📊 Category Overview" },
          { id: "inventory", label: "📋 Interface Inventory" },
          { id: "failures", label: "🔴 Failures & Risks" },
          { id: "stability", label: "📉 Interface Stability" },
          { id: "volume", label: "📈 Volume & Throughput" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: view === v.id ? "2px solid #0284c7" : "1px solid #e2e8f0",
            background: view === v.id ? "#e0f2fe" : "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: view === v.id ? 700 : 500,
          }}>{v.label}</button>
        ))}
      </div>

      {/* ====== THIRD-PARTY SYSTEM HEALTH MAP ====== */}
      {view === "systems" && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>🏢 Third-Party System Health Map · {d.thirdPartySystems.length} Connected Systems</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
            {d.thirdPartySystems.sort((a, b) => {
              const order = { failing: 0, degraded: 1, warning: 2, healthy: 3 };
              return (order[a.status] || 4) - (order[b.status] || 4);
            }).map(sys => {
              const sc = sysStatusCfg[sys.status] || sysStatusCfg.healthy;
              const sysIfaces = d.interfaces.filter(i => i.source.includes(sys.name) || i.target.includes(sys.name) || i.source.includes(sys.name.split(" ")[0]) || i.target.includes(sys.name.split(" ")[0]));
              const ifaceFailing = sysIfaces.filter(i => i.status === "fail").length;
              const ifaceWarning = sysIfaces.filter(i => i.status === "warning").length;
              return (
                <div key={sys.name} style={{
                  padding: "14px 16px", borderRadius: 10, background: sc.bg, border: `1px solid ${sc.border}`,
                  cursor: "pointer",
                }} onClick={() => { setFilterType(null); setFilterStatus(null); setView("inventory"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc.dot, boxShadow: sys.status === "failing" ? `0 0 8px ${sc.dot}` : "none" }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{sys.name}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: sc.text, padding: "2px 8px", borderRadius: 4, border: `1px solid ${sc.text}30`, letterSpacing: 0.5 }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{sys.category}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                    <span><strong>{sys.interfaces}</strong> interfaces</span>
                    <span>Uptime: <strong style={{ color: sys.uptime >= 99.5 ? "#059669" : sys.uptime >= 98 ? "#d97706" : "#dc2626" }}>{sys.uptime}%</strong></span>
                    {ifaceFailing > 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>🔴 {ifaceFailing} failing</span>}
                    {ifaceWarning > 0 && <span style={{ color: "#d97706", fontWeight: 600 }}>⚠️ {ifaceWarning} degraded</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 10, flexWrap: "wrap" }}>
            {Object.entries(sysStatusCfg).map(([key, sc]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc.dot }} />
                <span style={{ color: "#64748b" }}>{sc.label}</span>
              </div>
            ))}
          </div>

          {/* Central hub visual */}
          <Card>
            <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#475569" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🏗 Integration Architecture</div>
              All {d.thirdPartySystems.length} systems connect through <strong>S/4HANA</strong> + <strong>SAP CPI Middleware</strong> ({d.categories.find(c => c.type === "CPI/PI Flow")?.count || 0} integration flows)
              <br />+ <strong>EDI Gateway</strong> ({d.categories.find(c => c.type === "EDI/B2B")?.count || 0} B2B channels)
              + <strong>SFTP/File</strong> ({d.categories.find(c => c.type === "File/SFTP")?.count || 0} batch transfers)
              + <strong>Direct REST APIs</strong> ({d.categories.find(c => c.type === "REST API")?.count || 0} real-time)
            </div>
          </Card>
        </div>
      )}

      {/* ====== CATEGORY OVERVIEW ====== */}
      {view === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
            {d.categories.map(c => {
              const passRate = c.tested > 0 ? pct(c.passing, c.tested) : 0;
              const sc = passRate >= 90 ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669" } : passRate >= 75 ? { bg: "#fffbeb", border: "#fde68a", text: "#d97706" } : { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" };
              return (
                <Card key={c.type} style={{ borderLeft: `4px solid ${sc.text}`, cursor: "pointer" }} onClick={() => { setFilterType(c.type); setView("inventory"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.icon} {c.type}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: sc.text }}>{passRate}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{c.count} total · {c.tested} tested · {c.passing} passing</div>
                  <div style={{ marginTop: 6 }}><ProgressBar value={passRate} color={sc.text} height={5} /></div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{c.count - c.passing} need attention →</div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== INTERFACE INVENTORY ====== */}
      {view === "inventory" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={() => setFilterType(null)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: !filterType ? "2px solid #0284c7" : "1px solid #e2e8f0", background: !filterType ? "#e0f2fe" : "#fff", fontWeight: !filterType ? 700 : 400 }}>All Types</button>
            {d.categories.map(c => (
              <button key={c.type} onClick={() => setFilterType(c.type)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: filterType === c.type ? "2px solid #0284c7" : "1px solid #e2e8f0", background: filterType === c.type ? "#e0f2fe" : "#fff", fontWeight: filterType === c.type ? 700 : 400 }}>{c.icon} {c.type}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {["pass", "warning", "fail"].map(s => (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: filterStatus === s ? `2px solid ${statusCfg[s].text}` : "1px solid #e2e8f0", background: filterStatus === s ? statusCfg[s].bg : "#fff", fontWeight: filterStatus === s ? 700 : 400, color: statusCfg[s].text }}>
                {statusCfg[s].badge} ({d.interfaces.filter(i => i.status === s).length})
              </button>
            ))}
          </div>
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    {["ID", "Interface", "Type", "Dir", "Source → Target", "Vol/Day", "Latency", "SLA", "Error %", "Crit.", "Status"].map(h => (
                      <th key={h} style={{ padding: "5px 6px", fontWeight: 600, color: "#64748b", fontSize: 9, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInterfaces.map(iface => {
                    const sc = statusCfg[iface.status] || statusCfg["not-tested"];
                    return (
                      <tr key={iface.id} style={{ borderBottom: "1px solid #f1f5f9", background: iface.status === "fail" ? "#fef2f208" : "transparent" }}>
                        <td style={{ padding: "6px 6px" }}><code style={{ fontSize: 9 }}>{iface.id}</code></td>
                        <td style={{ padding: "6px 6px", fontWeight: 500, maxWidth: 180 }}>{iface.name}<div style={{ fontSize: 9, color: "#94a3b8" }}>{iface.messageType}</div></td>
                        <td style={{ padding: "6px 6px" }}><code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 9 }}>{iface.type}</code></td>
                        <td style={{ padding: "6px 6px", fontSize: 10 }}>{iface.direction === "inbound" ? "⬇" : iface.direction === "outbound" ? "⬆" : "↕"}</td>
                        <td style={{ padding: "6px 6px", fontSize: 10 }}>{iface.source} → {iface.target}</td>
                        <td style={{ padding: "6px 6px", fontWeight: 600 }}>{fmt(iface.dailyVolume)}</td>
                        <td style={{ padding: "6px 6px", color: iface.avgLatency > iface.sla ? "#dc2626" : "#475569" }}>{iface.avgLatency > 0 ? `${iface.avgLatency}s` : "—"}</td>
                        <td style={{ padding: "6px 6px", color: "#64748b" }}>{iface.sla}s</td>
                        <td style={{ padding: "6px 6px", color: iface.errorRate > 2 ? "#dc2626" : iface.errorRate > 1 ? "#d97706" : "#475569", fontWeight: 600 }}>{iface.errorRate}%</td>
                        <td style={{ padding: "6px 6px" }}><span style={{ fontSize: 9, fontWeight: 600, color: critColor(iface.criticality), textTransform: "uppercase" }}>{iface.criticality}</span></td>
                        <td style={{ padding: "6px 6px" }}><span style={{ padding: "2px 6px", borderRadius: 4, background: sc.bg, color: sc.text, fontWeight: 700, fontSize: 9 }}>{sc.badge}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ====== FAILURES & RISKS ====== */}
      {view === "failures" && (
        <div>
          {d.interfaces.filter(i => i.status === "fail").map(iface => (
            <Card key={iface.id} style={{ marginBottom: 10, borderLeft: "4px solid #dc2626" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                <div><span style={{ fontWeight: 700, fontSize: 14 }}>{iface.name}</span> <code style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", padding: "1px 5px", borderRadius: 3 }}>{iface.id}</code></div>
                <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 800, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" }}>FAILING</span>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#64748b", flexWrap: "wrap", marginBottom: 6 }}>
                <span>Type: <strong>{iface.type}</strong></span>
                <span>{iface.source} → {iface.target}</span>
                <span>Volume: <strong>{fmt(iface.dailyVolume)}/day</strong></span>
                <span>Error: <strong style={{ color: "#dc2626" }}>{iface.errorRate}%</strong></span>
                <span>Criticality: <strong style={{ color: critColor(iface.criticality), textTransform: "uppercase" }}>{iface.criticality}</strong></span>
              </div>
              {/* Find stability info */}
              {d.interfaceStability.filter(s => s.id === iface.id).map(stab => (
                <div key={stab.id} style={{ padding: "8px 12px", borderRadius: 6, background: "#fff5f5", border: "1px solid #fecaca", fontSize: 11, marginTop: 4 }}>
                  <div style={{ color: "#991b1b", marginBottom: 3 }}><strong>Root Cause:</strong> {stab.rootCause}</div>
                  <div style={{ color: "#991b1b" }}><strong>Impact:</strong> {stab.impact}</div>
                  <div style={{ color: "#b91c1c", marginTop: 3, fontSize: 10 }}>⏱ Down for <strong>{stab.weeksDown} weeks</strong> · Trend: <strong>{stab.trend}</strong></div>
                </div>
              ))}
            </Card>
          ))}
          <div style={{ marginTop: 8 }} />
          {d.interfaces.filter(i => i.status === "warning").map(iface => (
            <Card key={iface.id} style={{ marginBottom: 10, borderLeft: "4px solid #d97706" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                <div><span style={{ fontWeight: 700, fontSize: 13 }}>{iface.name}</span> <code style={{ fontSize: 10, background: "#fffbeb", color: "#d97706", padding: "1px 5px", borderRadius: 3 }}>{iface.id}</code></div>
                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" }}>WARNING</span>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#64748b", flexWrap: "wrap" }}>
                <span>{iface.type} · {iface.source} → {iface.target}</span>
                <span>Error: <strong style={{ color: "#d97706" }}>{iface.errorRate}%</strong></span>
                <span style={{ textTransform: "uppercase", color: critColor(iface.criticality), fontWeight: 600 }}>{iface.criticality}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ====== INTERFACE STABILITY (NEW SUB-REPORT) ====== */}
      {view === "stability" && (
        <div>
          {/* Stability trend header */}
          <Card style={{ marginBottom: 16, borderTop: `4px solid ${stabilityTrend === "worsening" ? "#dc2626" : stabilityTrend === "improving" ? "#059669" : "#d97706"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>📉 Interface Stability Trend</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>8-week rolling view · Interfaces up vs down · Incident count tracking</div>
              </div>
              <span style={{ padding: "4px 14px", borderRadius: 6, fontSize: 12, fontWeight: 800, color: stabilityTrend === "worsening" ? "#dc2626" : "#059669", border: `1px solid ${stabilityTrend === "worsening" ? "#fecaca" : "#a7f3d0"}`, background: stabilityTrend === "worsening" ? "#fef2f2" : "#ecfdf5" }}>
                {stabilityTrend === "worsening" ? "↘ WORSENING" : stabilityTrend === "improving" ? "↗ IMPROVING" : "→ STABLE"}
              </span>
            </div>

            {/* Visual bar chart - weekly stability */}
            <div style={{ display: "grid", gap: 6 }}>
              {d.stabilityHistory.map((w, i) => {
                const upPct = pct(w.totalUp, w.totalUp + w.totalDown);
                const isLatest = i === d.stabilityHistory.length - 1;
                return (
                  <div key={w.week} style={{ display: "flex", alignItems: "center", gap: 10, opacity: isLatest ? 1 : 0.85 }}>
                    <span style={{ fontSize: 11, fontWeight: isLatest ? 700 : 400, color: "#475569", minWidth: 90 }}>{w.week}</span>
                    <div style={{ flex: 1, display: "flex", height: 18, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${upPct}%`, background: "#22c55e", transition: "width 0.3s" }} />
                      <div style={{ width: `${100 - upPct}%`, background: "#ef4444", transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, minWidth: 50, color: w.totalDown > 5 ? "#dc2626" : w.totalDown > 2 ? "#d97706" : "#059669" }}>
                      {w.totalUp}↑ {w.totalDown}↓
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 30 }}>{w.incidentCount} inc</span>
                    <span style={{ fontSize: 10, color: w.avgErrorRate > 2 ? "#dc2626" : "#64748b", minWidth: 40 }}>{w.avgErrorRate}% err</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}><div style={{ width: 12, height: 8, borderRadius: 2, background: "#22c55e" }} /> Healthy</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}><div style={{ width: 12, height: 8, borderRadius: 2, background: "#ef4444" }} /> Failing/Down</div>
            </div>
          </Card>

          {/* Persistent failure tracking */}
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🔴 Persistent Interface Failures — Root Cause Tracker</div>
          {d.interfaceStability.sort((a, b) => b.weeksDown - a.weeksDown).map(stab => {
            const sevColor = stab.severity === "critical" ? { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", dot: "#ef4444" } : stab.severity === "high" ? { bg: "#fff7ed", border: "#fed7aa", text: "#ea580c", dot: "#f97316" } : { bg: "#fffbeb", border: "#fde68a", text: "#d97706", dot: "#eab308" };
            const trendLabel = stab.trend === "persistent" ? "Persistent (no improvement)" : stab.trend === "worsening" ? "Getting worse" : stab.trend === "new" ? "New failure" : "Intermittent";
            return (
              <Card key={stab.id} style={{ marginBottom: 10, borderLeft: `4px solid ${sevColor.dot}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{stab.name} <code style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 5px", borderRadius: 3 }}>{stab.id}</code></div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{stab.system}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, color: sevColor.text, background: sevColor.bg, border: `1px solid ${sevColor.border}` }}>{stab.severity.toUpperCase()}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" }}>⏱ {stab.weeksDown}w down</span>
                  </div>
                </div>

                {/* Weeks-down indicator bar */}
                <div style={{ display: "flex", gap: 3, marginTop: 10, marginBottom: 8 }}>
                  {d.stabilityHistory.map((w, i) => {
                    const isDown = w.errorInterfaces.includes(stab.id);
                    return <div key={i} style={{ flex: 1, height: 8, borderRadius: 3, background: isDown ? sevColor.dot : "#e2e8f0", opacity: isDown ? 1 : 0.4 }} title={`${w.week}: ${isDown ? "DOWN" : "UP"}`} />;
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginBottom: 8 }}>
                  <span>W01</span><span>W08 (current)</span>
                </div>

                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: "#334155", marginBottom: 3 }}><strong>Root Cause:</strong> {stab.rootCause}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}><strong>Business Impact:</strong> {stab.impact}</div>
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Trend: <strong style={{ color: stab.trend === "worsening" ? "#dc2626" : stab.trend === "persistent" ? "#ea580c" : "#d97706" }}>{trendLabel}</strong></div>
              </Card>
            );
          })}

          {/* Stability summary */}
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📊 Stability Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {[
                { label: "Interfaces Stable (8/8 weeks)", value: d.interfaces.length - d.interfaceStability.length, color: "#059669" },
                { label: "Persistent Failures (>4 weeks)", value: d.interfaceStability.filter(s => s.weeksDown > 4).length, color: "#dc2626" },
                { label: "New Failures (≤2 weeks)", value: d.interfaceStability.filter(s => s.trend === "new").length, color: "#d97706" },
                { label: "Worsening Trend", value: d.interfaceStability.filter(s => s.trend === "worsening").length, color: "#ea580c" },
                { label: "Total Incidents (8 weeks)", value: d.stabilityHistory.reduce((s, w) => s + w.incidentCount, 0), color: "#64748b" },
                { label: "Avg Weekly Error Rate", value: `${(d.stabilityHistory.reduce((s, w) => s + w.avgErrorRate, 0) / d.stabilityHistory.length).toFixed(1)}%`, color: "#64748b" },
              ].map(m => (
                <div key={m.label} style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ====== VOLUME & THROUGHPUT ====== */}
      {view === "volume" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📈 Interface Volume Distribution (Top 15)</div>
          <div style={{ display: "grid", gap: 6 }}>
            {[...d.interfaces].filter(i => i.dailyVolume > 0).sort((a, b) => b.dailyVolume - a.dailyVolume).slice(0, 15).map(iface => {
              const maxVol = Math.max(...d.interfaces.map(i => i.dailyVolume));
              const sc = statusCfg[iface.status] || statusCfg["pass"];
              return (
                <div key={iface.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, minWidth: 220, color: "#334155" }}>{iface.name}</span>
                  <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${(iface.dailyVolume / maxVol) * 100}%`, height: "100%", background: sc.text, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, minWidth: 60, textAlign: "right", color: sc.text }}>{fmt(iface.dailyVolume)}/d</span>
                  <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 35 }}>{iface.avgLatency > 0 ? `${iface.avgLatency}s` : "—"}</span>
                  <span style={{ fontSize: 10, color: iface.errorRate > 1 ? "#dc2626" : "#64748b", minWidth: 35 }}>{iface.errorRate}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#475569" }}>
            <strong>Total daily volume:</strong> {fmt(totalVolume)} messages across {d.totalActive} active interfaces. Stripe payment confirmations ({fmt(6200)}/day) and Fiori Sales Order OData ({fmt(8500)}/day) are highest-volume. Amex card feed ({fmt(4800)}/day) currently at 100% error rate — all card transactions blocked.
          </div>
        </Card>
      )}
    </div>
  );
};

export default InterfaceQuality;
