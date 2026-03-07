import React from "react";
import Layout from "@theme/Layout";
import RiskReport from "@site/src/components/reports/RiskReport";

export default function RiskRegisterPage() {
  return (
    <Layout title="Risk Register" description="S/4HANA CFO Risk Report">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">Risk Register</h1>
        <RiskReport />
      </div>
    </Layout>
  );
}
