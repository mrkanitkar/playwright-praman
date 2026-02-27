import React, { useState } from "react";
import { GLOBAL_REGIONS, SAP_DATA_SOURCES } from "./data/globalData";
import { fmt, pct } from "./shared/utils";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";

export const GeoImpact = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [view, setView] = useState("map");

  const allCountries = GLOBAL_REGIONS.flatMap(r => r.countries.map(c => ({ ...c, region: r.id, regionName: r.name, hub: r.hub })));
  const totalUsers = allCountries.reduce((s, c) => s + c.users, 0);
  const countriesAtRisk = allCountries.filter(c => c.simulation.overallScore < 70);
  const usersAtRisk = countriesAtRisk.reduce((s, c) => s + c.users, 0);
  const wave1Ready = allCountries.filter(c => c.wave === 1 && c.simulation.passRate === 100).length;
  const wave1Total = allCountries.filter(c => c.wave === 1).length;
  const avgScore = Math.round(allCountries.reduce((s, c) => s + c.simulation.overallScore, 0) / allCountries.length);

  const displayed = selectedRegion ? GLOBAL_REGIONS.filter(r => r.id === selectedRegion) : GLOBAL_REGIONS;

  const scoreColor = (s) => s >= 90 ? "#059669" : s >= 70 ? "#d97706" : s >= 50 ? "#ea580c" : "#dc2626";
  const scoreBg = (s) => s >= 90 ? "#ecfdf5" : s >= 70 ? "#fffbeb" : s >= 50 ? "#fff7ed" : "#fef2f2";
  const scoreBorder = (s) => s >= 90 ? "#a7f3d0" : s >= 70 ? "#fde68a" : s >= 50 ? "#fed7aa" : "#fecaca";
  const waveColor = (w) => w === 1 ? "#2563eb" : w === 2 ? "#7c3aed" : "#64748b";

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)", borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>GLOBAL ROLLOUT INTELLIGENCE</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Geographic & Customer Impact Assessment</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Real user experience simulation across {allCountries.length} countries · Telemetry from ST03N, STAD, Focused Run RUM, SAP Web Analytics</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { label: "Total Users Globally", value: fmt(totalUsers), color: "#93c5fd" },
            { label: "Countries Simulated", value: allCountries.length, color: "#93c5fd" },
            { label: "Countries At Risk", value: countriesAtRisk.length, color: countriesAtRisk.length > 3 ? "#f87171" : "#fbbf24" },
            { label: "Users Impacted", value: fmt(usersAtRisk), color: usersAtRisk > 2000 ? "#f87171" : "#fbbf24" },
            { label: "Wave 1 Ready", value: `${wave1Ready}/${wave1Total}`, color: wave1Ready === wave1Total ? "#4ade80" : "#fbbf24" },
            { label: "Avg Global Score", value: `${avgScore}%`, color: avgScore >= 80 ? "#4ade80" : avgScore >= 60 ? "#fbbf24" : "#f87171" },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "map", label: "Country Overview", icon: "🌍" },
          { id: "wave", label: "Rollout Waves", icon: "🚀" },
          { id: "network", label: "Network Impact", icon: "📡" },
          { id: "sources", label: "SAP Data Sources", icon: "🔗" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: view === v.id ? "2px solid #1e40af" : "1px solid #e2e8f0",
            background: view === v.id ? "#eff6ff" : "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: view === v.id ? 700 : 500,
            display: "flex", alignItems: "center", gap: 6,
          }}><span>{v.icon}</span> {v.label}</button>
        ))}
      </div>

      {/* Region filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setSelectedRegion(null)} style={{
          padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
          border: !selectedRegion ? "2px solid #1e40af" : "1px solid #e2e8f0",
          background: !selectedRegion ? "#eff6ff" : "#fff", fontWeight: !selectedRegion ? 700 : 400,
        }}>All Regions</button>
        {GLOBAL_REGIONS.map(r => (
          <button key={r.id} onClick={() => setSelectedRegion(r.id)} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
            border: selectedRegion === r.id ? "2px solid #1e40af" : "1px solid #e2e8f0",
            background: selectedRegion === r.id ? "#eff6ff" : "#fff", fontWeight: selectedRegion === r.id ? 700 : 400,
          }}>{r.name} ({r.countries.length})</button>
        ))}
      </div>

      {/* Country Overview */}
      {view === "map" && displayed.map(region => (
        <Card key={region.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{region.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Data Center: {region.hub} · {fmt(region.totalUsers)} users</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {region.countries.map(c => {
              const sim = c.simulation;
              return (
                <div key={c.code} style={{ padding: 14, borderRadius: 8, background: scoreBg(sim.overallScore), border: `1px solid ${scoreBorder(sim.overallScore)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{c.flag}</span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{fmt(c.users)} users · CC {c.companyCode} · {c.locale}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: waveColor(c.wave) }}>Wave {c.wave}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(sim.overallScore) }}>{sim.overallScore}%</span>
                    </div>
                  </div>
                  {/* Simulation summary */}
                  <div style={{ display: "flex", gap: 16, fontSize: 11, marginBottom: 6, flexWrap: "wrap" }}>
                    <span>Network: <strong>{c.network.latency}ms</strong> ({c.network.type})</span>
                    <span>Pass rate: <strong style={{ color: sim.passRate === 100 ? "#059669" : "#dc2626" }}>{sim.passRate}%</strong></span>
                    <span>Degradation: <strong style={{ color: sim.avgDegradation <= 30 ? "#059669" : sim.avgDegradation <= 70 ? "#d97706" : "#dc2626" }}>+{sim.avgDegradation}%</strong></span>
                    <span>Browser issues: <strong>{sim.browserIssues}</strong></span>
                    <span>Locale issues: <strong style={{ color: sim.localeIssues > 0 ? "#d97706" : "#059669" }}>{sim.localeIssues}</strong></span>
                    <span>Mobile: {sim.mobileReady ? <strong style={{ color: "#059669" }}>Ready</strong> : <strong style={{ color: "#dc2626" }}>Not Ready</strong>}</span>
                  </div>
                  <ProgressBar value={sim.overallScore} height={5} />
                  {/* Failing transactions */}
                  {sim.transactions.filter(t => t.status === "fail").length > 0 && (
                    <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 6, fontSize: 11 }}>
                      <span style={{ fontWeight: 700, color: "#dc2626" }}>Failing: </span>
                      {sim.transactions.filter(t => t.status === "fail").map((t, i) => (
                        <span key={t.tcode}>
                          <code style={{ background: "#fef2f2", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>{t.tcode}</code>
                          {" "}{t.name} ({t.simulated.toFixed(1)}s vs {t.sla}s SLA)
                          {i < sim.transactions.filter(t2 => t2.status === "fail").length - 1 ? " · " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {/* Rollout Waves */}
      {view === "wave" && [1, 2, 3].map(wave => {
        const waveCountries = allCountries.filter(c => c.wave === wave);
        const waveUsers = waveCountries.reduce((s, c) => s + c.users, 0);
        const waveReady = waveCountries.filter(c => c.simulation.passRate === 100).length;
        const waveAvg = waveCountries.length > 0 ? Math.round(waveCountries.reduce((s, c) => s + c.simulation.overallScore, 0) / waveCountries.length) : 0;
        return (
          <Card key={wave} style={{ marginBottom: 16, borderLeft: `4px solid ${waveColor(wave)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Wave {wave} {wave === 1 ? "— Go-Live Target" : wave === 2 ? "— Phase 2 Rollout" : "— Expansion Markets"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{waveCountries.length} countries · {fmt(waveUsers)} users</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(waveAvg) }}>{waveAvg}%</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{waveReady}/{waveCountries.length} countries ready</div>
              </div>
            </div>
            <ProgressBar value={waveAvg} height={8} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginTop: 12 }}>
              {waveCountries.sort((a, b) => b.simulation.overallScore - a.simulation.overallScore).map(c => (
                <div key={c.code} style={{ padding: 10, borderRadius: 6, background: scoreBg(c.simulation.overallScore), border: `1px solid ${scoreBorder(c.simulation.overallScore)}`, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{c.flag} <strong>{c.name}</strong></span>
                    <span style={{ fontWeight: 800, color: scoreColor(c.simulation.overallScore) }}>{c.simulation.overallScore}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{fmt(c.users)} users · {c.network.latency}ms latency</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Network Impact Analysis */}
      {view === "network" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Network Latency vs User Experience</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Correlation between network conditions (from Focused Run RUM / STAD) and simulated Playwright test results</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                {["Country", "Latency", "Bandwidth", "Connection", "Degradation", "Score", "Verdict"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#64748b", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCountries.sort((a, b) => a.network.latency - b.network.latency).map(c => {
                const verdict = c.network.latency <= 30 ? "No action needed" : c.network.latency <= 80 ? "Monitor — edge cache recommended" : c.network.latency <= 150 ? "CDN/edge deployment required" : "Dedicated infrastructure needed";
                const vColor = c.network.latency <= 30 ? "#059669" : c.network.latency <= 80 ? "#d97706" : "#dc2626";
                return (
                  <tr key={c.code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{c.flag} {c.name}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: 4, background: scoreBg(c.simulation.overallScore), color: scoreColor(c.simulation.overallScore), fontWeight: 700, fontSize: 11 }}>{c.network.latency}ms</span>
                    </td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{c.network.bandwidth}</td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{c.network.type}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: c.simulation.avgDegradation <= 30 ? "#059669" : c.simulation.avgDegradation <= 70 ? "#d97706" : "#dc2626" }}>+{c.simulation.avgDegradation}%</td>
                    <td style={{ padding: "8px 10px", fontWeight: 800, color: scoreColor(c.simulation.overallScore) }}>{c.simulation.overallScore}%</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: vColor, fontWeight: 500 }}>{verdict}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            <strong>How latency data is collected:</strong> Focused Run RUM captures real client-to-server roundtrip times from every SAP Fiori session. STAD provides server-side network time decomposition per dialog step. Praman extracts these latency profiles and configures Playwright's <code style={{ background: "#e2e8f0", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>page.route()</code> network throttling to match exact conditions per geography.
          </div>
        </Card>
      )}

      {/* SAP Data Sources */}
      {view === "sources" && (
        <div style={{ display: "grid", gap: 14 }}>
          {Object.entries(SAP_DATA_SOURCES).map(([key, src]) => (
            <Card key={key} style={{ borderLeft: `4px solid ${key === "ST03N" ? "#2563eb" : key === "STAD" ? "#7c3aed" : key === "FocusedRun" ? "#059669" : "#d97706"}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{key === "FocusedRun" ? "SAP Focused Run (RUM)" : key === "WebAnalytics" ? "SAP Web Analytics" : `Transaction ${key}`} — {src.name}</div>
              <div style={{ fontSize: 12, color: "#334155", marginBottom: 8, lineHeight: 1.5 }}><strong>Provides:</strong> {src.provides}</div>
              <div style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.5 }}><strong>Playwright usage:</strong> {src.playwrightUsage}</div>
            </Card>
          ))}
          <Card style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>How Praman Bridges SAP Telemetry → Playwright</div>
            <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
              Praman queries these SAP systems via RFC/OData to extract real user profiles: which browsers your users run, what screen resolution they have, what network latency they experience, and which locales they need. This telemetry feeds directly into Playwright browser context configuration — so every test runs under conditions matching your actual user base. A user in Nigeria on a 220ms VPN connection gets tested differently than a user in Germany on a 12ms LAN. The results you see in this dashboard reflect actual simulated user experience, not idealized lab conditions.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GeoImpact;
