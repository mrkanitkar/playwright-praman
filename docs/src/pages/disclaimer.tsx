// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ZesTest (support@zestest.in)
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="praman-prose-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function Disclaimer(): ReactNode {
  return (
    <Layout title="Disclaimer" description="Praman Disclaimer">
      <main className="praman-prose-page">
        <h1 style={{ marginBottom: '2rem' }}>Disclaimer</h1>

        <Section title="AI-Assisted Development">
          <p>
            This software was developed with the assistance of AI coding tools, including Anthropic
            Claude and AI agents. AI tools were used for code generation, architecture design,
            testing, and documentation.
          </p>
          <p>
            This software is provided {'"'}AS IS{'"'} under the Apache License 2.0, without warranty of
            any kind. See the <a href="/playwright-praman/license">LICENSE</a> file for full terms.
          </p>
          <p>
            The authors do not guarantee any specific outcome, fitness for a particular purpose,
            or error-free operation.
          </p>
          <p>Before using, you should:</p>
          <ul>
            <li>Conduct a thorough code review</li>
            <li>Perform security testing</li>
            <li>Validate against your specific SAP environment</li>
            <li>Test extensively in staging environments</li>
          </ul>
        </Section>

        <Section title="Your Responsibility">
          <p>
            By using this software, you accept full responsibility for any consequences arising
            from its use. Report security vulnerabilities to{' '}
            <a href="mailto:security@zestest.in">security@zestest.in</a> (see SECURITY.md).
          </p>
        </Section>

        <Section title="Trademarks">
          <p>
            This project is an independent open-source tool and is not affiliated with, endorsed by,
            or sponsored by any trademark holder mentioned herein.
          </p>
          <ul>
            <li>
              <strong>SAP, SAPUI5, SAP Fiori, SAP S/4HANA,</strong> and <strong>SAP Business
              Technology Platform</strong> are trademarks or registered trademarks of SAP SE or an
              SAP affiliate company in Germany and other countries.
            </li>
            <li>
              <strong>Microsoft</strong> and <strong>Playwright</strong> are trademarks of the
              Microsoft group of companies.
            </li>
            <li>
              <strong>Tricentis</strong> and <strong>Tosca</strong> are trademarks of Tricentis GmbH.
            </li>
            <li>All other trademarks are the property of their respective owners.</li>
          </ul>
        </Section>
      </main>
    </Layout>
  );
}
