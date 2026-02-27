import React from "react";
import Layout from "@theme/Layout";
import HowItWorks from "@site/src/components/reports/HowItWorks";

export default function HowItWorksPage() {
  return (
    <Layout title="How It Works" description="How Praman Generates Quality Intelligence">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <HowItWorks />
      </div>
    </Layout>
  );
}
