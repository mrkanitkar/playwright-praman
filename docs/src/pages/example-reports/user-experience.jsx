import React from "react";
import Layout from "@theme/Layout";
import UserExperience from "@site/src/components/reports/UserExperience";

export default function UserExperiencePage() {
  return (
    <Layout title="User Experience" description="S/4HANA Global User Experience Analysis">
      <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="sr-only">User Experience</h1>
        <UserExperience />
      </div>
    </Layout>
  );
}
