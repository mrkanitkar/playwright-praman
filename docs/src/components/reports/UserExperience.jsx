import React, { useState } from "react";
import { GLOBAL_REGIONS, LOCALE_VALIDATION, BROWSER_COMPAT } from "./data/globalData";
import { fmt } from "./shared/utils";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";

export const UserExperience = () => {
  const allCountries = GLOBAL_REGIONS.flatMap(r => r.countries);
  const [selectedCountry, setSelectedCountry] = useState("DE");
  const [view, setView] = useState("experience");

  const country = allCountries.find(c => c.code === selectedCountry) || allCountries[0];
  const sim = country.simulation;
  const localeData = LOCALE_VALIDATION.find(l => l.locale === country.locale);

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #134e4a 0%, #065f46 50%, #047857 100%)", borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>USER EXPERIENCE SIMULATION</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>What Will Your Users Actually Experience?</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Playwright simulates real network, browser, device, and locale conditions sourced from SAP Focused Run & Web Analytics</div>
        </div>
      </div>

      {/* Country Selector */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Select Country to Simulate</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allCountries.map(c => (
            <button key={c.code} onClick={() => setSelectedCountry(c.code)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: selectedCountry === c.code ? "2px solid #065f46" : "1px solid #e2e8f0",
              background: selectedCountry === c.code ? "#ecfdf5" : "#fff",
              fontWeight: selectedCountry === c.code ? 700 : 400,
            }}>{c.flag} {c.name}</button>
          ))}
        </div>
      </Card>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "experience", label: "User Experience", icon: "👤" },
          { id: "browser", label: "Browser Compatibility", icon: "🌐" },
          { id: "locale", label: "Locale & Language", icon: "🔤" },
          { id: "device", label: "Device Readiness", icon: "📱" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: view === v.id ? "2px solid #065f46" : "1px solid #e2e8f0",
            background: view === v.id ? "#ecfdf5" : "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: view === v.id ? 700 : 500,
            display: "flex", alignItems: "center", gap: 6,
          }}><span>{v.icon}</span> {v.label}</button>
        ))}
      </div>

      {/* User Experience View */}
      {view === "experience" && (
        <div>
          {/* Country profile card */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 36 }}>{country.flag}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{country.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{fmt(country.users)} users · Wave {country.wave} · {country.locale} · {country.currency}</div>
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: sim.overallScore >= 90 ? "#059669" : sim.overallScore >= 70 ? "#d97706" : "#dc2626" }}>
                {sim.overallScore}%
              </div>
            </div>
          </Card>

          {/* Simulated conditions */}
          <Card style={{ marginBottom: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 10 }}>Playwright Simulation Conditions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {[
                { label: "Network Latency", value: `${country.network.latency}ms`, detail: country.network.type, source: country.network.source },
                { label: "Bandwidth", value: country.network.bandwidth, detail: "Throttled to match", source: "Focused Run RUM" },
                { label: "Browser", value: `Chrome ${Object.entries(country.browser).sort((a,b) => b[1]-a[1])[0]?.[1]}%`, detail: "Primary browser tested", source: country.browser.source },
                { label: "Resolution", value: country.device.primaryRes, detail: `${country.device.desktop}% desktop`, source: country.device.source },
                { label: "Locale", value: country.locale, detail: country.currency, source: "SAP Web Analytics" },
                { label: "Peak Hour", value: country.peakHour, detail: "Test scheduling", source: "ST03N" },
              ].map(item => (
                <div key={item.label} style={{ padding: 10, background: "#fff", borderRadius: 6, border: "1px solid #d1fae5" }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "2px 0" }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{item.detail}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, fontStyle: "italic" }}>Source: {item.source}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Transaction-by-transaction experience */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Transaction Response Times — Simulated vs Optimal</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>How each critical transaction performs under {country.name}'s network conditions</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  {["TCode", "Transaction", "Optimal", "Simulated", "SLA", "Degradation", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#64748b", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sim.transactions.map(t => {
                  const deg = Math.round(((t.simulated - t.optimal) / t.optimal) * 100);
                  const statusColor = t.status === "pass" ? "#059669" : t.status === "warning" ? "#d97706" : "#dc2626";
                  const statusBg = t.status === "pass" ? "#ecfdf5" : t.status === "warning" ? "#fffbeb" : "#fef2f2";
                  return (
                    <tr key={t.tcode} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px" }}><code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>{t.tcode}</code></td>
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>{t.name}</td>
                      <td style={{ padding: "8px 10px", color: "#059669", fontWeight: 600 }}>{t.optimal.toFixed(1)}s</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: statusBg, color: statusColor, fontWeight: 700 }}>{t.simulated.toFixed(1)}s</span>
                      </td>
                      <td style={{ padding: "8px 10px", color: "#64748b" }}>{t.sla}s</td>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: deg <= 20 ? "#059669" : deg <= 50 ? "#d97706" : "#dc2626" }}>+{deg}%</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: statusColor }}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sim.passRate < 100 && (
              <div style={{ marginTop: 12, padding: 12, background: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#991b1b", lineHeight: 1.5 }}>
                <strong>Impact:</strong> Users in {country.name} with {country.network.latency}ms latency on {country.network.type} will experience {sim.transactions.filter(t => t.status === "fail").length} transaction(s) exceeding SLA thresholds. Average degradation is +{sim.avgDegradation}% compared to optimal conditions ({GLOBAL_REGIONS.find(r => r.countries.some(c2 => c2.code === "DE"))?.countries.find(c2 => c2.code === "DE")?.network.latency || 12}ms LAN).
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Browser Compatibility */}
      {view === "browser" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Browser Distribution in {country.name}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Source: SAP Focused Run RUM — actual browser versions detected from {country.name} user sessions</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.entries(country.browser).filter(([k]) => k !== "source").map(([browser, share]) => (
                <div key={browser} style={{ padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", flex: "1 1 120px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>{share}%</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{browser}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Global Browser Compatibility Matrix</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Playwright tests executed on Chromium, Firefox, and WebKit engines</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  {["Browser", "Engine", "Global Share", "SAP Fiori Certified", "Issues Found", "Notes"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#64748b", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BROWSER_COMPAT.map(b => (
                  <tr key={b.browser} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{b.browser}</td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{b.engine}</td>
                    <td style={{ padding: "8px 10px" }}>{b.globalShare}%</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ color: b.fioriCertified ? "#059669" : "#dc2626", fontWeight: 600 }}>{b.fioriCertified ? "✓ Yes" : "✗ No"}</span>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: b.issues === 0 ? "#059669" : b.issues <= 2 ? "#d97706" : "#dc2626" }}>{b.issues}</span>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#475569" }}>{b.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Locale & Language */}
      {view === "locale" && (
        <div>
          {localeData && (
            <Card style={{ marginBottom: 16, borderLeft: `4px solid ${localeData.status === "pass" ? "#059669" : localeData.status === "warning" ? "#d97706" : "#dc2626"}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{country.flag} {country.name} — Locale Validation ({country.locale})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                {[
                  { label: "Date Format", value: localeData.dateFormat },
                  { label: "Number Format", value: localeData.numberFormat },
                  { label: "Currency", value: `${localeData.currencySymbol} (${country.currency})` },
                  { label: "Decimal Separator", value: `"${localeData.decimalSep}"` },
                  { label: "Thousands Separator", value: localeData.thousandSep === " " ? "space" : `"${localeData.thousandSep}"` },
                ].map(item => (
                  <div key={item.label} style={{ padding: 10, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {localeData.issues.length > 0 && (
                <div style={{ padding: 10, background: localeData.status === "fail" ? "#fef2f2" : "#fffbeb", borderRadius: 6, border: `1px solid ${localeData.status === "fail" ? "#fecaca" : "#fde68a"}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: localeData.status === "fail" ? "#991b1b" : "#92400e", marginBottom: 4 }}>Issues Found:</div>
                  {localeData.issues.map((issue, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#475569", padding: "2px 0", paddingLeft: 12, borderLeft: `2px solid ${localeData.status === "fail" ? "#fecaca" : "#fde68a"}`, marginBottom: 3 }}>{issue}</div>
                  ))}
                </div>
              )}
            </Card>
          )}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>All Locale Validations</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Playwright tests with <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>browser.newContext({"{"} locale: "..." {"}"})</code> — validates date, number, and currency rendering per locale</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  {["Locale", "Date", "Number", "Currency", "Status", "Issues"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#64748b", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOCALE_VALIDATION.map(l => {
                  const c2 = allCountries.find(c3 => c3.locale === l.locale);
                  return (
                    <tr key={l.locale} style={{ borderBottom: "1px solid #f1f5f9", background: selectedCountry === c2?.code ? "#f0fdf4" : "transparent" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{c2?.flag || ""} {l.locale}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{l.dateFormat}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{l.numberFormat}</td>
                      <td style={{ padding: "8px 10px" }}>{l.currencySymbol}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: l.status === "pass" ? "#059669" : l.status === "warning" ? "#d97706" : "#dc2626" }}>{l.status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: "#475569" }}>{l.issues.length === 0 ? "—" : l.issues.join("; ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Device Readiness */}
      {view === "device" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Device Distribution in {country.name}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Source: SAP Focused Run RUM — screen resolution and device type from real user sessions</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Desktop", pct: country.device.desktop, icon: "🖥️", color: "#2563eb" },
                { label: "Tablet", pct: country.device.tablet, icon: "📱", color: "#7c3aed" },
                { label: "Mobile", pct: country.device.mobile, icon: "📲", color: "#059669" },
              ].map(d => (
                <div key={d.label} style={{ flex: "1 1 100px", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: 24 }}>{d.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: d.color }}>{d.pct}%</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{d.label}</div>
                  <div style={{ marginTop: 6 }}><ProgressBar value={d.pct} color={d.color} height={4} /></div>
                </div>
              ))}
            </div>
            <div style={{ padding: 10, background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
              <strong>Primary Resolution:</strong> {country.device.primaryRes} · <strong>Mobile Ready:</strong>{" "}
              <span style={{ color: sim.mobileReady ? "#059669" : "#dc2626", fontWeight: 700 }}>{sim.mobileReady ? "Yes" : "No — touch targets and viewport issues detected"}</span>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Global Device Readiness</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Playwright device emulation using <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>devices['iPhone 14']</code>, viewport sizing, and touch event simulation</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  {["Country", "Desktop", "Tablet", "Mobile", "Resolution", "Mobile Ready"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#64748b", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCountries.map(c => (
                  <tr key={c.code} style={{ borderBottom: "1px solid #f1f5f9", background: selectedCountry === c.code ? "#f0fdf4" : "transparent" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{c.flag} {c.name}</td>
                    <td style={{ padding: "8px 10px" }}>{c.device.desktop}%</td>
                    <td style={{ padding: "8px 10px" }}>{c.device.tablet}%</td>
                    <td style={{ padding: "8px 10px", fontWeight: c.device.mobile > 15 ? 700 : 400, color: c.device.mobile > 15 ? "#d97706" : "#475569" }}>{c.device.mobile}%</td>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{c.device.primaryRes}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ color: c.simulation.mobileReady ? "#059669" : "#dc2626", fontWeight: 600 }}>{c.simulation.mobileReady ? "✓ Yes" : "✗ No"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserExperience;
