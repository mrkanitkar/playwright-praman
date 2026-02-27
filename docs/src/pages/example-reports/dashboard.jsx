import React from "react";
import Layout from "@theme/Layout";
import FullDashboard from "@site/src/components/reports/FullDashboard";

export default function DashboardPage() {
  return (
    <Layout title="S/4HANA Quality Dashboard" description="Full S/4HANA Transformation Quality Dashboard with all 12 reports">
      <FullDashboard />
    </Layout>
  );
}
