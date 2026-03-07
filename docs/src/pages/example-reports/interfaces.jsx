import React from "react";
import Layout from "@theme/Layout";
import InterfaceQuality from "@site/src/components/reports/InterfaceQuality";

export default function InterfacesPage() {
  return (
    <Layout title="Interface Quality" description="S/4HANA Integration & Interface Quality Report">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">Interface Quality</h1>
        <InterfaceQuality />
      </div>
    </Layout>
  );
}
