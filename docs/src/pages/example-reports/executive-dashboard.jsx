import React from "react";
import Layout from "@theme/Layout";
import ExecutiveDashboard from "@site/src/components/reports/ExecutiveDashboard";

export default function ExecutiveDashboardPage() {
  return (
    <Layout title="Executive Dashboard" description="S/4HANA Steering Committee Quality Report">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <ExecutiveDashboard />
      </div>
    </Layout>
  );
}
