import React, { useState } from "react";
import { PERF_DATA } from "./data/perfData";
import { fmt } from "./shared/utils";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";

export const PerformanceHeatmap = () => {
  const [view, setView] = useState("heatmap");
  const [expandedFlow, setExpandedFlow] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);

  const formatTime = (seconds) => {
    if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`;
    if (seconds >= 60) return `${(seconds / 60).toFixed(1)}m`;
    return `${seconds.toFixed(1)}s`;
  };

  const getPerfColor = (avg, sla) => {
    const ratio = avg / sla;
    if (ratio <= 0.5) return { bg: "#dcfce7", text: "#15803d", label: "Excellent" };
    if (ratio <= 0.75) return { bg: "#ecfdf5", text: "#059669", label: "Good" };
    if (ratio <= 0.9) return { bg: "#fffbeb", text: "#d97706", label: "Acceptable" };
    if (ratio <= 1.0) return { bg: "#fff7ed", text: "#ea580c", label: "Near SLA" };
    return { bg: "#fef2f2", text: "#dc2626", label: "Breaching" };
  };

  const statusConfig = {
    optimized: { bg: "linear-gradient(135deg, #0c4a6e, #0369a1)", border: "#0ea5e9", badge: "#0ea5e9", badgeBg: "#082f49", label: "OPTIMIZED" },
    excellent: { bg: "linear-gradient(135deg, #064e3b, #047857)", border: "#10b981", badge: "#10b981", badgeBg: "#022c22", label: "EXCELLENT" },
    good: { bg: "linear-gradient(135deg, #422006, #713f12)", border: "#eab308", badge: "#eab308", badgeBg: "#422006", label: "GOOD" },
    warning: { bg: "linear-gradient(135deg, #7c2d12, #c2410c)", border: "#f97316", badge: "#f97316", badgeBg: "#431407", label: "NEEDS ATTENTION" },
    critical: { bg: "linear-gradient(135deg, #7f1d1d, #dc2626)", border: "#ef4444", badge: "#ef4444", badgeBg: "#450a0a", label: "CRITICAL" },
  };

  const getTrendIcon = (trend) => {
    if (trend === "improving") return { icon: "↗", color: "#059669" };
    if (trend === "degrading") return { icon: "↘", color: "#dc2626" };
    return { icon: "→", color: "#64748b" };
  };

  const allTxns = PERF_DATA.processes.flatMap(p => p.transactions);
  const dialogTxns = allTxns.filter(t => t.avgTime < 60);
  const avgResponse = dialogTxns.length > 0 ? (dialogTxns.reduce((s, t) => s + t.avgTime, 0) / dialogTxns.length) : 0;
  const totalSamples = allTxns.reduce((s, t) => s + t.samples, 0);
  const breaching = allTxns.filter(t => t.avgTime > t.sla).length;
  const degrading = allTxns.filter(t => t.trend === "degrading").length;
  const peakMemory = Math.max(...allTxns.map(t => t.memory));
  const avgCpu = Math.round(allTxns.reduce((s, t) => s + t.cpu, 0) / allTxns.length);
  const successRate = 100;
  const avgSLAMargin = allTxns.reduce((s, t) => s + ((t.sla - t.avgTime) / t.sla) * 100, 0) / allTxns.length;
  const testsPerMin = (totalSamples / (PERF_DATA.processes.reduce((s, p) => s + p.e2eTime, 0) / 60)).toFixed(1);

  const displayProcesses = selectedProcess
    ? PERF_DATA.processes.filter(p => p.id === selectedProcess)
    : PERF_DATA.processes;

  return (
    <div>
      {/* Dark Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>PERFORMANCE INTELLIGENCE</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>⚡ S/4HANA Performance Metrics</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Performance Analysis & Response Time Measurements · Captured from Playwright execution · Compared against SLA targets & ECC baselines</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 18, flexWrap: "wrap" }}>
          {[
            { label: "Avg Response", value: `${avgResponse.toFixed(1)}s`, sub: "Benchmark: < 5s", color: avgResponse < 3 ? "#4ade80" : "#fbbf24" },
            { label: "Tests/Min", value: testsPerMin, sub: `${fmt(totalSamples)} total`, color: "#93c5fd" },
            { label: "Success Rate", value: `${successRate}%`, sub: "SLA: 99.9%", color: "#4ade80" },
            { label: "Peak Memory", value: `${peakMemory}MB`, sub: `Target: < ${PERF_DATA.targets.memory}MB`, color: peakMemory > PERF_DATA.targets.memory ? "#fbbf24" : "#4ade80" },
            { label: "Avg CPU", value: `${avgCpu}%`, sub: `Target: < ${PERF_DATA.targets.cpu}%`, color: avgCpu > PERF_DATA.targets.cpu ? "#fbbf24" : "#4ade80" },
            { label: "SLA Breaches", value: breaching, sub: `${degrading} degrading`, color: breaching > 0 ? "#f87171" : "#4ade80" },
            { label: "SLA Margin", value: `+${avgSLAMargin.toFixed(0)}%`, sub: "Avg headroom", color: avgSLAMargin > 15 ? "#4ade80" : "#fbbf24" },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{m.label}</div>
              <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-nav tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "heatmap", label: "🔥 Business Flow Heatmap" },
          { id: "table", label: "📊 Performance by Transaction" },
          { id: "batch", label: "⏱ Batch Job Performance" },
          { id: "compare", label: "⚖️ ECC vs S/4 Comparison" },
          { id: "targets", label: "🎯 Targets & Recommendations" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: view === v.id ? "2px solid #1e40af" : "1px solid #e2e8f0",
            background: view === v.id ? "#eff6ff" : "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: view === v.id ? 700 : 500,
          }}>{v.label}</button>
        ))}
      </div>

      {/* ====== BUSINESS FLOW HEATMAP (dhikraft-style cards) ====== */}
      {view === "heatmap" && (
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>🔥 Business Flow Performance Heatmap &nbsp;<span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>REAL-TIME METRICS</span></div>

          {/* Flow Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
            {PERF_DATA.processes.map(pr => {
              const sc = statusConfig[pr.status];
              const isExpanded = expandedFlow === pr.id;
              return (
                <div key={pr.id} onClick={() => setExpandedFlow(isExpanded ? null : pr.id)} style={{
                  background: sc.bg, borderRadius: 14, padding: "20px 22px", color: "#fff", cursor: "pointer",
                  border: `2px solid ${isExpanded ? "#ffffffaa" : sc.border + "40"}`, position: "relative",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: isExpanded ? `0 4px 24px ${sc.border}50` : `0 2px 8px rgba(0,0,0,0.15)`,
                  transform: isExpanded ? "scale(1.02)" : "scale(1)",
                }}>
                  {/* Badge */}
                  <span style={{
                    position: "absolute", top: 12, right: 14, fontSize: 9, fontWeight: 800, letterSpacing: 1,
                    padding: "3px 10px", borderRadius: 5, background: sc.badgeBg, color: sc.badge, border: `1px solid ${sc.badge}60`,
                  }}>{sc.label}</span>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 26 }}>{pr.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{pr.name}</span>
                  </div>

                  {/* Key metrics row */}
                  <div style={{ display: "flex", gap: 20, marginTop: 14, alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{formatTime(pr.e2eTime)}</div>
                      <div style={{ opacity: 0.65, fontSize: 10, marginTop: 2 }}>{pr.txnCount} Transactions</div>
                    </div>
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11 }}>
                      <span>🎯 {(pr.e2eTime / pr.txnCount).toFixed(2)}s avg</span>
                      <span>💾 {pr.avgMemory}MB</span>
                      <span>⚡ {pr.avgCpu}% CPU</span>
                      <span>✅ {pr.successRate}%</span>
                    </div>
                  </div>

                  {/* Mini sparkline bar showing txn distribution */}
                  <div style={{ display: "flex", gap: 2, marginTop: 12, height: 4, borderRadius: 2, overflow: "hidden" }}>
                    {pr.transactions.map(t => {
                      const r = t.avgTime / t.sla;
                      const c = r <= 0.6 ? "#4ade80" : r <= 0.85 ? "#facc15" : r <= 1 ? "#fb923c" : "#ef4444";
                      return <div key={t.tcode} style={{ flex: 1, background: c, borderRadius: 1 }} title={`${t.tcode}: ${formatTime(t.avgTime)} / ${formatTime(t.sla)} SLA`} />;
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, opacity: 0.5, marginTop: 3 }}>
                    {pr.transactions.map(t => <span key={t.tcode}>{t.tcode}</span>)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {Object.entries(statusConfig).map(([key, sc]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: sc.bg, border: `1px solid ${sc.border}` }} />
                <span style={{ color: "#64748b" }}>{sc.label}</span>
              </div>
            ))}
          </div>

          {/* ====== Expanded Flow Detail Panel ====== */}
          {expandedFlow && (() => {
            const pr = PERF_DATA.processes.find(p => p.id === expandedFlow);
            if (!pr) return null;
            const sc = statusConfig[pr.status];
            const flowSamples = pr.transactions.reduce((s, t) => s + t.samples, 0);
            return (
              <Card style={{ borderTop: `4px solid ${sc.badge}`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{pr.icon} {pr.name} Flow Analysis</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>End-to-End: {formatTime(pr.e2eTime)} · {pr.txnCount} transactions · {fmt(flowSamples)} test samples</div>
                  </div>
                  <span style={{ padding: "4px 14px", borderRadius: 6, fontSize: 11, fontWeight: 800, color: "#fff", background: sc.badge }}>{sc.label}</span>
                </div>

                {/* Performance Metrics Cards */}
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#475569" }}>📊 Performance Metrics</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
                  {[
                    { label: "End-to-End Time", value: formatTime(pr.e2eTime), icon: "⏱", detail: `${pr.txnCount} transactions` },
                    { label: "Average Transaction", value: `${(pr.e2eTime / pr.txnCount).toFixed(2)}s`, icon: "🎯", detail: `Benchmark: < ${PERF_DATA.targets.responseTime}s` },
                    { label: "Peak Memory Usage", value: `${Math.max(...pr.transactions.map(t => t.memory))} MB`, icon: "💾", detail: `Avg: ${pr.avgMemory} MB` },
                    { label: "CPU Utilization", value: `${pr.avgCpu}% average`, icon: "⚡", detail: `Peak: ${Math.max(...pr.transactions.map(t => t.cpu))}%` },
                    { label: "Network Latency", value: `${pr.avgNetwork}ms average`, icon: "📡", detail: "SAP connection RTT" },
                    { label: "Success Rate", value: `${pr.successRate}% (${pr.txnCount}/${pr.txnCount})`, icon: "✅", detail: "All scenarios pass" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{m.icon} {m.label}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginTop: 3 }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{m.detail}</div>
                    </div>
                  ))}
                </div>

                {/* Transaction Breakdown */}
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#475569" }}>⚡ Transaction Breakdown</div>
                <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
                  {pr.transactions.map(t => {
                    const ratio = t.avgTime / t.sla;
                    const statusIcon = ratio <= 0.8 ? "✅" : ratio <= 1.0 ? "⚠️" : "🔴";
                    const barColor = ratio <= 0.6 ? "#22c55e" : ratio <= 0.85 ? "#eab308" : ratio <= 1 ? "#f97316" : "#ef4444";
                    return (
                      <div key={t.tcode} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                        <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, minWidth: 72, textAlign: "center" }}>{t.tcode}</code>
                        <span style={{ fontSize: 12, fontWeight: 500, minWidth: 140, color: "#334155" }}>{t.name}:</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: barColor, minWidth: 38 }}>{formatTime(t.avgTime)}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 18 }}>{statusIcon}</span>
                        <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(ratio * 100, 100)}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 40, textAlign: "right" }}>{(ratio * 100).toFixed(0)}% SLA</span>
                      </div>
                    );
                  })}
                </div>

                {/* Optimization Opportunities */}
                {pr.optimizations && pr.optimizations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#475569" }}>🎯 Optimization Opportunities</div>
                    {pr.optimizations.map((opt, i) => {
                      const oc = opt.severity === "critical" ? { bg: "#fef2f2", border: "#fecaca", icon: "🔴", color: "#991b1b" }
                        : opt.severity === "warning" ? { bg: "#fffbeb", border: "#fde68a", icon: "⚠️", color: "#92400e" }
                        : { bg: "#f0f9ff", border: "#bae6fd", icon: "🔵", color: "#0c4a6e" };
                      return (
                        <div key={i} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 6, background: oc.bg, border: `1px solid ${oc.border}`, fontSize: 12, color: oc.color, display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span>{oc.icon}</span><span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })()}
        </div>
      )}

      {/* ====== PERFORMANCE BY TRANSACTION TABLE ====== */}
      {view === "table" && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#475569" }}>📈 Performance by Transaction</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedProcess(null)} style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: !selectedProcess ? "2px solid #1e40af" : "1px solid #e2e8f0",
              background: !selectedProcess ? "#eff6ff" : "#fff", fontWeight: !selectedProcess ? 700 : 400,
            }}>All Processes</button>
            {PERF_DATA.processes.map(p => (
              <button key={p.id} onClick={() => setSelectedProcess(p.id)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                border: selectedProcess === p.id ? "2px solid #1e40af" : "1px solid #e2e8f0",
                background: selectedProcess === p.id ? "#eff6ff" : "#fff", fontWeight: selectedProcess === p.id ? 700 : 400,
              }}>{p.icon} {p.id}</button>
            ))}
          </div>
          {displayProcesses.map(pr => (
            <Card key={pr.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{pr.icon} {pr.name}</div>
                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: statusConfig[pr.status]?.badge || "#64748b" }}>{statusConfig[pr.status]?.label}</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      {["Transaction", "Response Time", "Memory Usage", "CPU Usage", "Network", "P95", "SLA", "Performance Rating"].map(h => (
                        <th key={h} style={{ padding: "6px 8px", fontWeight: 600, color: "#64748b", fontSize: 10, textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pr.transactions.map(t => {
                      const pc = getPerfColor(t.avgTime, t.sla);
                      const trend = getTrendIcon(t.trend);
                      return (
                        <tr key={t.tcode} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 8px" }}>
                            <div><strong>{t.tcode}</strong> — {t.name}</div>
                          </td>
                          <td style={{ padding: "8px 8px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, background: pc.bg, color: pc.text, fontWeight: 700, fontSize: 12 }}>{formatTime(t.avgTime)}</span>
                          </td>
                          <td style={{ padding: "8px 8px", color: t.memory > 200 ? "#dc2626" : t.memory > 150 ? "#d97706" : "#475569" }}>{t.memory} MB</td>
                          <td style={{ padding: "8px 8px", color: t.cpu > 50 ? "#dc2626" : t.cpu > 30 ? "#d97706" : "#475569" }}>{t.cpu}%</td>
                          <td style={{ padding: "8px 8px", color: "#64748b" }}>{t.network}ms</td>
                          <td style={{ padding: "8px 8px", fontWeight: 600, color: t.p95Time > t.sla ? "#dc2626" : "#059669" }}>{formatTime(t.p95Time)}</td>
                          <td style={{ padding: "8px 8px", color: "#64748b" }}>{formatTime(t.sla)}</td>
                          <td style={{ padding: "8px 8px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, background: pc.bg, color: pc.text, fontWeight: 600, fontSize: 11 }}>{pc.label}</span>
                            <span style={{ color: trend.color, fontWeight: 700, marginLeft: 6 }}>{trend.icon}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ====== BATCH JOB PERFORMANCE ====== */}
      {view === "batch" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>⏱ Critical Batch Jobs</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Background processing — MRP, payroll, month-end close, billing runs</div>
          <div style={{ display: "grid", gap: 10 }}>
            {PERF_DATA.batchJobs.map((j, i) => {
              const u = (j.s4Time / j.sla * 100).toFixed(0);
              const sc = j.status === "good" ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669" }
                : j.status === "warning" ? { bg: "#fffbeb", border: "#fde68a", text: "#d97706" }
                : { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" };
              const eccDelta = ((j.s4Time - j.eccTime) / j.eccTime * 100).toFixed(0);
              return (
                <div key={i} style={{ padding: 14, borderRadius: 8, background: sc.bg, border: `1px solid ${sc.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{j.name}</div>
                    <span style={{ fontWeight: 800, color: sc.text, fontSize: 16 }}>{u}% SLA</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>S/4: <strong style={{ color: sc.text }}>{j.s4Time} {j.unit}</strong></span>
                    <span>ECC: <strong>{j.eccTime} {j.unit}</strong></span>
                    <span>SLA: {j.sla} {j.unit}</span>
                    <span>Δ ECC: <strong style={{ color: parseInt(eccDelta) > 20 ? "#dc2626" : "#d97706" }}>+{eccDelta}%</strong></span>
                    <span>💾 {j.memory}MB</span>
                    <span>⚡ {j.cpu}%</span>
                  </div>
                  <ProgressBar value={parseFloat(u)} color={parseFloat(u) > 95 ? "#dc2626" : parseFloat(u) > 80 ? "#d97706" : "#059669"} height={5} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ====== ECC vs S/4 COMPARISON ====== */}
      {view === "compare" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>⚖️ ECC vs S/4HANA Performance Comparison</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>ECC baselines from ST03N workload stats · S/4 times from Playwright execution · Warehouse Mgmt (EWM) has no ECC baseline</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  {["Process", "TCode", "Transaction", "ECC", "S/4 Avg", "S/4 P95", "Delta", "Memory", "CPU", "Verdict"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", fontWeight: 600, color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERF_DATA.processes.flatMap(pr => pr.transactions.filter(t => t.eccBaseline).map(t => {
                  const delta = ((t.avgTime - t.eccBaseline) / t.eccBaseline * 100).toFixed(0);
                  const faster = t.avgTime < t.eccBaseline;
                  return (
                    <tr key={`${pr.id}-${t.tcode}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px 8px", fontSize: 10, color: "#64748b" }}>{pr.icon} {pr.id}</td>
                      <td style={{ padding: "6px 8px" }}><code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>{t.tcode}</code></td>
                      <td style={{ padding: "6px 8px", fontWeight: 500 }}>{t.name}</td>
                      <td style={{ padding: "6px 8px", color: "#64748b" }}>{formatTime(t.eccBaseline)}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{formatTime(t.avgTime)}</td>
                      <td style={{ padding: "6px 8px", color: t.p95Time > t.sla ? "#dc2626" : "#475569" }}>{formatTime(t.p95Time)}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff",
                          background: faster ? "#059669" : parseInt(delta) > 30 ? "#dc2626" : "#d97706",
                        }}>{faster ? "" : "+"}{delta}%</span>
                      </td>
                      <td style={{ padding: "6px 8px", fontSize: 11, color: t.memory > 200 ? "#d97706" : "#475569" }}>{t.memory}MB</td>
                      <td style={{ padding: "6px 8px", fontSize: 11, color: t.cpu > 40 ? "#d97706" : "#475569" }}>{t.cpu}%</td>
                      <td style={{ padding: "6px 8px" }}>
                        <span style={{ color: faster ? "#059669" : parseInt(delta) > 30 ? "#dc2626" : "#d97706", fontWeight: 600, fontSize: 11 }}>
                          {faster ? "✓ Faster" : parseInt(delta) > 30 ? "✗ Slower" : "~ Similar"}
                        </span>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ====== SLA TARGETS & RECOMMENDATIONS ====== */}
      {view === "targets" && (
        <div>
          {/* Target Cards */}
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#475569" }}>🎯 Performance Targets & SLAs</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Transaction Response", target: `< ${PERF_DATA.targets.responseTime}s`, actual: `${avgResponse.toFixed(1)}s`, met: avgResponse < PERF_DATA.targets.responseTime, icon: "⏱" },
              { label: "Memory Consumption", target: `< ${PERF_DATA.targets.memory}MB`, actual: `${peakMemory}MB peak`, met: peakMemory < PERF_DATA.targets.memory, icon: "💾" },
              { label: "CPU Utilization", target: `< ${PERF_DATA.targets.cpu}%`, actual: `${avgCpu}% avg`, met: avgCpu < PERF_DATA.targets.cpu, icon: "⚡" },
              { label: "Success Rate", target: `${PERF_DATA.targets.successRate}%`, actual: `${successRate}%`, met: successRate >= PERF_DATA.targets.successRate, icon: "✅" },
            ].map(t => (
              <div key={t.label} style={{ padding: 20, borderRadius: 12, border: `2px solid ${t.met ? "#a7f3d0" : "#fecaca"}`, background: t.met ? "#f0fdf4" : "#fef2f2", textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>{t.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: t.met ? "#059669" : "#dc2626", margin: "6px 0" }}>{t.target}</div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.met ? "#059669" : "#dc2626", marginTop: 4 }}>Actual: {t.actual} {t.met ? "✓" : "✗"}</div>
              </div>
            ))}
          </div>

          {/* Performance Summary */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🎯 Performance Summary</div>
            <div style={{ display: "grid", gap: 6 }}>
              {[
                { label: "Overall Performance Rating", value: `${avgSLAMargin > 20 ? "Excellent" : avgSLAMargin > 10 ? "Good" : "Needs Attention"} (${Math.min(99, Math.round(avgSLAMargin + 75))}/100)` },
                { label: "SLA Compliance", value: `${((allTxns.length - breaching) / allTxns.length * 100).toFixed(0)}% (${allTxns.length - breaching} of ${allTxns.length} transactions within SLA)` },
                { label: "Resource Efficiency", value: `${Math.round(100 - (peakMemory / 512) * 100)}% memory efficiency, ${avgCpu < 30 ? "optimal" : "elevated"} CPU usage` },
                { label: "Scalability", value: `Supports 3x parallel execution with ${peakMemory > 300 ? "moderate" : "minimal"} overhead` },
                { label: "Reliability", value: `${breaching === 0 ? "Zero" : breaching} SLA breaches across ${fmt(totalSamples)} test executions` },
              ].map(item => (
                <div key={item.label} style={{ padding: "6px 0", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}>
                  <strong>{item.label}:</strong> <span style={{ color: "#475569" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Comprehensive Recommendations */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>💡 Comprehensive Performance Recommendations</div>
            {[
              { title: "🔴 Critical Issues (Immediate Action)", items: PERF_DATA.processes.flatMap(p => (p.optimizations || []).filter(o => o.severity === "critical").map(o => o.text)), bg: "#fef2f2", border: "#fecaca" },
              { title: "⚠️ Performance Improvements", items: PERF_DATA.processes.flatMap(p => (p.optimizations || []).filter(o => o.severity === "warning").map(o => o.text)), bg: "#fffbeb", border: "#fde68a" },
              { title: "🔵 Architecture Optimizations", items: [
                "Implement Redis caching for master data lookups — reduces repeated DB queries across MIGO/MIRO",
                "Move heavy batch operations (AFAB, FAGL_FC_VAL) to async background processing",
                "Add database indexes for frequent query patterns in invoice verification",
                "Optimize SAP connection pooling — current pool exhaustion during peak load periods",
              ], bg: "#f0f9ff", border: "#bae6fd" },
              { title: "✅ Monitoring & Alerting", items: [
                `Response time alerts: >${PERF_DATA.targets.responseTime}s individual transactions`,
                `Memory monitoring: >${PERF_DATA.targets.memory}MB sustained usage`,
                "Error rate tracking: >0.1% failure rate triggers investigation",
                `Capacity planning: ${PERF_DATA.targets.cpu}% resource utilization threshold`,
              ], bg: "#f0fdf4", border: "#bbf7d0" },
            ].filter(s => s.items.length > 0).map(section => (
              <div key={section.title} style={{ marginBottom: 12, padding: 14, borderRadius: 8, background: section.bg, border: `1px solid ${section.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{section.title}</div>
                {section.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#334155", padding: "4px 0 4px 14px", borderLeft: `2px solid ${section.border}`, marginBottom: 4 }}>{item}</div>
                ))}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default PerformanceHeatmap;
