import React, { useState } from "react";
import { PROCESS_DATA } from "./data/processData";
import { pct, fmtCurrency, getStatusColor } from "./shared/utils";
import { Card } from "./shared/Card";
import { ProgressBar } from "./shared/ProgressBar";
import { SeverityBadge } from "./shared/SeverityBadge";

export const ProcessDeepDive = () => {
  const [selected, setSelected] = useState("O2C");
  const process = PROCESS_DATA.find(p => p.id === selected);
  const readiness = pct(process.passed, process.totalScenarios);

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Select Business Process</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {PROCESS_DATA.map(p => {
          const r = pct(p.passed, p.totalScenarios);
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: selected === p.id ? "2px solid #1e40af" : "1px solid #e2e8f0",
                background: selected === p.id ? "#eff6ff" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: getStatusColor(r),
              }} />
              <span style={{ fontWeight: selected === p.id ? 700 : 500, fontSize: 13 }}>{p.name}</span>
            </button>
          );
        })}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{process.name}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Business Owner: <strong>{process.owner}</strong></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: getStatusColor(readiness) }}>{readiness}%</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Process Readiness</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { l: "Total Scenarios", v: process.totalScenarios, c: "#1e293b" },
            { l: "Passed", v: process.passed, c: "#059669" },
            { l: "Failed", v: process.failed, c: "#dc2626" },
            { l: "Blocked", v: process.blocked, c: "#d97706" },
            { l: "Users Affected", v: process.usersAffected, c: "#6366f1" },
            { l: "Revenue at Risk", v: fmtCurrency(process.revenueAtRisk), c: "#d97706" },
          ].map(m => (
            <div key={m.l} style={{ textAlign: "center", padding: 10, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 2 }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Key Transactions Covered</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {process.tcodes.map(t => (
            <span key={t} style={{ padding: "3px 10px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{t}</span>
          ))}
        </div>
      </Card>

      {/* Failure details */}
      {process.failureDetails.length > 0 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#dc2626" }}>
            ⚠ Open Issues Requiring Business Decision
          </div>
          {process.failureDetails.map((f, i) => (
            <div key={i} style={{
              padding: "14px 16px",
              background: i % 2 === 0 ? "#fef2f2" : "#fff",
              borderRadius: 8,
              marginBottom: 8,
              border: "1px solid #fee2e2",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{f.scenario}</span>
                <SeverityBadge severity={f.severity} />
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                Transaction: <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 3 }}>{f.tcode}</code>
              </div>
              <div style={{ fontSize: 13, color: "#1e293b" }}>
                <strong>Business Impact:</strong> {f.impact}
              </div>
            </div>
          ))}
        </Card>
      )}
      {process.failureDetails.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: 20, color: "#059669" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>All scenarios passing — No open business-impacting issues</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProcessDeepDive;
