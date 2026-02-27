import React from "react";
import { PROCESS_DATA } from "./data/processData";
import { SeverityBadge } from "./shared/SeverityBadge";
import { Card } from "./shared/Card";

export const RiskReport = () => {
  const allIssues = PROCESS_DATA.flatMap(p =>
    p.failureDetails.map(f => ({ ...f, process: p.name, owner: p.owner, revenueAtRisk: p.revenueAtRisk }))
  ).sort((a, b) => (a.severity === "high" ? 0 : 1) - (b.severity === "high" ? 0 : 1));

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Business Risk Register</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Quality issues mapped to business risk, revenue impact, and accountability
        </div>

        {allIssues.map((issue, i) => (
          <div key={i} style={{
            padding: "16px",
            marginBottom: 10,
            borderRadius: 8,
            border: `1px solid ${issue.severity === "high" ? "#fecaca" : "#fed7aa"}`,
            background: issue.severity === "high" ? "#fef2f2" : "#fffbeb",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SeverityBadge severity={issue.severity} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{issue.scenario}</span>
              </div>
              <span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>{issue.process}</span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              <strong>Impact:</strong> {issue.impact}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
              <span>Owner: <strong>{issue.owner}</strong></span>
              <span>TCode: <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>{issue.tcode}</code></span>
            </div>
          </div>
        ))}
      </Card>

      {/* Risk Heatmap */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Risk Heatmap — Likelihood vs Business Impact</div>
        <div style={{ position: "relative", width: "100%", maxWidth: 500 }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr", gridTemplateRows: "30px 80px 80px 80px", gap: 2 }}>
            <div />
            <div style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#64748b", paddingTop: 8 }}>Low Likelihood</div>
            <div style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#64748b", paddingTop: 8 }}>Medium</div>
            <div style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#64748b", paddingTop: 8 }}>High Likelihood</div>

            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>High Impact</div>
            <div style={{ background: "#fde68a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>Payroll errors</div>
            <div style={{ background: "#fca5a5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>Month-end close delay</div>
            <div style={{ background: "#ef4444", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center", color: "#fff" }}>Credit block orders</div>

            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>Med Impact</div>
            <div style={{ background: "#bbf7d0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>—</div>
            <div style={{ background: "#fde68a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>MRP planning gaps</div>
            <div style={{ background: "#fca5a5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>Intercompany billing</div>

            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>Low Impact</div>
            <div style={{ background: "#bbf7d0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>—</div>
            <div style={{ background: "#bbf7d0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>Batch returns</div>
            <div style={{ background: "#fde68a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, padding: 6, textAlign: "center" }}>Service PO workaround</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiskReport;
