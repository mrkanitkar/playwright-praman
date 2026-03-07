import React from "react";
import Layout from "@theme/Layout";
import PerformanceHeatmap from "@site/src/components/reports/PerformanceHeatmap";

export default function PerformancePage() {
  return (
    <Layout title="Performance Heatmap" description="S/4HANA Transaction Performance by Process">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">Performance Heatmap</h1>
        <PerformanceHeatmap />
      </div>
    </Layout>
  );
}
