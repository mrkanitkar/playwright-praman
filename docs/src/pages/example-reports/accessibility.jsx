import React from "react";
import Layout from "@theme/Layout";
import AccessibilityReport from "@site/src/components/reports/AccessibilityReport";

export default function AccessibilityPage() {
  return (
    <Layout title="Accessibility Report" description="S/4HANA WCAG 2.1 AA Accessibility Audit">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <AccessibilityReport />
      </div>
    </Layout>
  );
}
