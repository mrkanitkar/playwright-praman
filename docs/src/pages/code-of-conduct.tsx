import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

export default function CodeOfConduct(): ReactNode {
  return (
    <Layout title="Code of Conduct" description="Contributor Covenant Code of Conduct">
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#020617', marginBottom: '2rem' }}>
          Contributor Covenant Code of Conduct
        </h1>

        <Section title="Our Pledge">
          <p>
            We as members, contributors, and leaders pledge to make participation in our community
            a harassment-free experience for everyone, regardless of age, body size, visible or
            invisible disability, ethnicity, sex characteristics, gender identity and expression,
            level of experience, education, socio-economic status, nationality, personal appearance,
            race, caste, color, religion, or sexual identity and orientation.
          </p>
          <p>
            We pledge to act and interact in ways that contribute to an open, welcoming, diverse,
            inclusive, and healthy community.
          </p>
        </Section>

        <Section title="Our Standards">
          <p>Examples of behavior that contributes to a positive environment for our community include:</p>
          <ul>
            <li>Demonstrating empathy and kindness toward other people</li>
            <li>Being respectful of differing opinions, viewpoints, and experiences</li>
            <li>Giving and gracefully accepting constructive feedback</li>
            <li>Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience</li>
            <li>Focusing on what is best not just for us as individuals, but for the overall community</li>
          </ul>
          <p>Examples of unacceptable behavior include:</p>
          <ul>
            <li>The use of sexualized language or imagery, and sexual attention or advances of any kind</li>
            <li>Trolling, insulting or derogatory comments, and personal or political attacks</li>
            <li>Public or private harassment</li>
            <li>Publishing others{'\''}  private information, such as a physical or email address, without their explicit permission</li>
            <li>Other conduct which could reasonably be considered inappropriate in a professional setting</li>
          </ul>
        </Section>

        <Section title="Enforcement Responsibilities">
          <p>
            Community leaders are responsible for clarifying and enforcing our standards of acceptable
            behavior and will take appropriate and fair corrective action in response to any behavior
            that they deem inappropriate, threatening, offensive, or harmful.
          </p>
          <p>
            Community leaders have the right and responsibility to remove, edit, or reject comments,
            commits, code, wiki edits, issues, and other contributions that are not aligned to this
            Code of Conduct, and will communicate reasons for moderation decisions when appropriate.
          </p>
        </Section>

        <Section title="Scope">
          <p>
            This Code of Conduct applies within all community spaces, and also applies when an
            individual is officially representing the community in public spaces. Examples of
            representing our community include using an official e-mail address, posting via an
            official social media account, or acting as an appointed representative at an online
            or offline event.
          </p>
        </Section>

        <Section title="Enforcement">
          <p>
            Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to
            the community leaders responsible for enforcement at{' '}
            <a href="mailto:security@zestest.in">security@zestest.in</a>. All complaints will be
            reviewed and investigated promptly and fairly.
          </p>
          <p>
            All community leaders are obligated to respect the privacy and security of the reporter
            of any incident.
          </p>
        </Section>

        <Section title="Enforcement Guidelines">
          <p>
            Community leaders will follow these Community Impact Guidelines in determining the
            consequences for any action they deem in violation of this Code of Conduct:
          </p>

          <h3 style={h3}>1. Correction</h3>
          <p><strong>Community Impact:</strong> Use of inappropriate language or other behavior deemed unprofessional or unwelcome in the community.</p>
          <p><strong>Consequence:</strong> A private, written warning from community leaders, providing clarity around the nature of the violation and an explanation of why the behavior was inappropriate. A public apology may be requested.</p>

          <h3 style={h3}>2. Warning</h3>
          <p><strong>Community Impact:</strong> A violation through a single incident or series of actions.</p>
          <p><strong>Consequence:</strong> A warning with consequences for continued behavior. No interaction with the people involved, including unsolicited interaction with those enforcing the Code of Conduct, for a specified period of time. Violating these terms may lead to a temporary or permanent ban.</p>

          <h3 style={h3}>3. Temporary Ban</h3>
          <p><strong>Community Impact:</strong> A serious violation of community standards, including sustained inappropriate behavior.</p>
          <p><strong>Consequence:</strong> A temporary ban from any sort of interaction or public communication with the community for a specified period of time. Violating these terms may lead to a permanent ban.</p>

          <h3 style={h3}>4. Permanent Ban</h3>
          <p><strong>Community Impact:</strong> Demonstrating a pattern of violation of community standards, including sustained inappropriate behavior, harassment of an individual, or aggression toward or disparagement of classes of individuals.</p>
          <p><strong>Consequence:</strong> A permanent ban from any sort of public interaction within the community.</p>
        </Section>

        <Section title="Attribution">
          <p>
            This Code of Conduct is adapted from the{' '}
            <a href="https://www.contributor-covenant.org" target="_blank" rel="noopener noreferrer">Contributor Covenant</a>,
            version 2.1, available at{' '}
            <a href="https://www.contributor-covenant.org/version/2/1/code_of_conduct.html" target="_blank" rel="noopener noreferrer">
              contributor-covenant.org/version/2/1/code_of_conduct.html
            </a>.
          </p>
          <p>
            Community Impact Guidelines were inspired by{' '}
            <a href="https://github.com/mozilla/diversity" target="_blank" rel="noopener noreferrer">
              Mozilla{'\''}s code of conduct enforcement ladder
            </a>.
          </p>
        </Section>
      </main>
    </Layout>
  );
}

const h3: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem' };

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>{title}</h2>
      <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
