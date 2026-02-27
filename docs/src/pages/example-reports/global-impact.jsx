import React from "react";
import Layout from "@theme/Layout";
import GeoImpact from "@site/src/components/reports/GeoImpact";

export default function GlobalImpactPage() {
  return (
    <Layout title="Global Impact" description="S/4HANA Geographic Impact & Network Simulation">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <GeoImpact />
      </div>
    </Layout>
  );
}
