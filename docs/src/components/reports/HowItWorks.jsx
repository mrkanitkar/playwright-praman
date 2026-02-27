import React from "react";
import { Card } from "./shared/Card";

export const HowItWorks = () => (
  <div>
    <Card style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#1e293b" }}>How Praman + Playwright Generates These Reports</div>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
        Every report in this dashboard is derived from actual automated test execution data. Here's the architecture:
      </div>
    </Card>

    <div style={{ display: "grid", gap: 16 }}>
      {[
        {
          step: "1",
          title: "Automated SAP Test Execution",
          desc: "Praman's Playwright plugin executes end-to-end business scenarios against S/4HANA — real transactions like VA01, ME21N, FB01, MIGO across all business processes.",
          detail: "Each test maps to a specific business scenario (e.g., 'Create sales order with credit check') using SAP-specific selectors and Fiori/UI5 automation.",
          color: "#2563eb",
        },
        {
          step: "2",
          title: "Structured Test Metadata",
          desc: "Tests are annotated with business metadata: process area, business owner, user role, transaction codes, criticality, and revenue impact classification.",
          detail: "Playwright reporters collect pass/fail/blocked status, execution time, screenshots, and error details for every scenario.",
          color: "#7c3aed",
        },
        {
          step: "3",
          title: "Business Intelligence Layer",
          desc: "Raw test results are aggregated into business-meaningful metrics: process readiness %, role readiness, data migration accuracy, and risk categorization.",
          detail: "The plugin's reporting module maps T-codes → processes → roles → business impact, creating the stakeholder-ready views you see in this dashboard.",
          color: "#059669",
        },
        {
          step: "4",
          title: "Stakeholder-Specific Reports",
          desc: "Different views for different audiences: Steering Committee gets Go/No-Go, CFO gets risk & revenue exposure, Process Owners get scenario details, CHRO gets role readiness.",
          detail: "Reports are generated automatically after each test suite run, providing continuous quality visibility throughout the transformation programme.",
          color: "#d97706",
        },
      ].map(item => (
        <Card key={item.step} style={{ borderLeft: `4px solid ${item.color}` }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: item.color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}>
              {item.step}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>{item.desc}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{item.detail}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>

    <Card style={{ marginTop: 20, background: "#f8fafc" }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1e40af" }}>Key Differentiator</div>
      <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
        Traditional test reporting shows "245 of 260 tests passed." Praman's business-aware reporting answers the questions stakeholders actually ask: "Can my AP clerks process invoices on Day 1?", "Is our Order-to-Cash flow ready?", "What's the revenue at risk if we go live now?"
      </div>
    </Card>
  </div>
);

export default HowItWorks;
