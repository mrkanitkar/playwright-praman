import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

export default function Notice(): ReactNode {
  return (
    <Layout title="Notice" description="Praman Attribution Notice">
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#020617', marginBottom: '2rem' }}>
          Notice
        </h1>

        <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7 }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Praman (playwright-praman)<br />
            Copyright 2024-2026 ZesTest
          </p>

          <p>
            This product was developed independently and does not contain code from the projects
            listed below. The following projects served as architectural references and inspiration
            during design:
          </p>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '1rem',
            padding: '1.25rem', background: '#edf4fa', borderRadius: 10,
            border: '2px solid rgba(0,112,173,0.19)', marginTop: '1.5rem',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: 'var(--ifm-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.1rem', fontWeight: 800,
            }}>
              w5
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                wdi5{' '}
                <a href="https://github.com/ui5-community/wdi5" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ifm-color-primary)' }}>
                  github.com/ui5-community/wdi5
                </a>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7 }}>
                Licensed under Apache License 2.0.<br />
                Architectural patterns for SAP UI5 browser bridge design were studied during
                Praman{'\''}s independent implementation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
