import React from "react";
import Layout from "@theme/Layout";
import DataMigration from "@site/src/components/reports/DataMigration";

export default function DataMigrationPage() {
  return (
    <Layout title="Data Migration" description="S/4HANA Data Migration Quality Report">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">Data Migration</h1>
        <DataMigration />
      </div>
    </Layout>
  );
}
