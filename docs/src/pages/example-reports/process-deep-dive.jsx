import React from "react";
import Layout from "@theme/Layout";
import ProcessDeepDive from "@site/src/components/reports/ProcessDeepDive";

export default function ProcessDeepDivePage() {
  return (
    <Layout title="Process Deep Dive" description="S/4HANA Business Process Deep Dive Analysis">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">Process Deep Dive</h1>
        <ProcessDeepDive />
      </div>
    </Layout>
  );
}
