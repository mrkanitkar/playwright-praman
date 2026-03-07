import React from "react";
import Layout from "@theme/Layout";
import RoleReadiness from "@site/src/components/reports/RoleReadiness";

export default function RoleReadinessPage() {
  return (
    <Layout title="Role Readiness" description="S/4HANA Day-1 Readiness by Business Role">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">Role Readiness</h1>
        <RoleReadiness />
      </div>
    </Layout>
  );
}
