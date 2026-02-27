import React from "react";
import Layout from "@theme/Layout";
import E2EQuality from "@site/src/components/reports/E2EQuality";

export default function E2EQualityPage() {
  return (
    <Layout title="E2E Quality" description="S/4HANA End-to-End Cross-System Quality Report">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <E2EQuality />
      </div>
    </Layout>
  );
}
