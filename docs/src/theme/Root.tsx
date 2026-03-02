import React, { useState, useEffect, useRef, useCallback } from 'react';

const DOCS_URL = 'https://praman.zestest.in';
const LLMS_TXT = `${DOCS_URL}/llms-full.txt`;

const CONTEXT_PREFIX =
  'I am reading the Praman documentation — an AI-First SAP UI5 Test Automation platform for Playwright. ' +
  `For full documentation context, read: ${LLMS_TXT}\n\n` +
  'Current page: ';

interface AiProvider {
  name: string;
  icon: string;
  buildUrl: (prompt: string) => string;
  color: string;
}

const providers: AiProvider[] = [
  {
    name: 'ChatGPT',
    icon: 'M',  // placeholder, replaced by SVG below
    buildUrl: (prompt) =>
      `https://chatgpt.com/?hints=search&temporary-chat=true&q=${encodeURIComponent(prompt)}`,
    color: '#10a37f',
  },
  {
    name: 'Perplexity',
    icon: 'P',
    buildUrl: (prompt) =>
      `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`,
    color: '#20808d',
  },
];

function SparkleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

function ChatGptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
}

function PerplexityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.4 9.36-7 10.5-3.6-1.14-7-5.67-7-10.5V6.3l7-3.12zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z"/>
    </svg>
  );
}

function AskAiButton() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside]);

  const handleProviderClick = (provider: AiProvider) => {
    const currentPage = typeof window !== 'undefined' ? window.location.href : DOCS_URL;
    const prompt = CONTEXT_PREFIX + currentPage + '\n\nMy question: ';
    window.open(provider.buildUrl(prompt), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const providerIcons = [<ChatGptIcon key="chatgpt" />, <PerplexityIcon key="perplexity" />];

  return (
    <div className="ask-ai-container">
      {isOpen && (
        <div ref={popoverRef} className="ask-ai-popover">
          <div className="ask-ai-popover-header">Ask AI about Praman</div>
          <div className="ask-ai-popover-body">
            {providers.map((provider, i) => (
              <button
                key={provider.name}
                className="ask-ai-provider"
                onClick={() => handleProviderClick(provider)}
                style={{ '--provider-color': provider.color } as React.CSSProperties}
              >
                <span className="ask-ai-provider-icon">{providerIcons[i]}</span>
                <span className="ask-ai-provider-name">{provider.name}</span>
                <span className="ask-ai-provider-arrow">&#8599;</span>
              </button>
            ))}
          </div>
          <div className="ask-ai-popover-footer">
            Opens in a new tab with docs context
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        className="ask-ai-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ask AI about Praman documentation"
        title="Ask AI about Praman"
      >
        <SparkleIcon />
      </button>
    </div>
  );
}

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AskAiButton />
    </>
  );
}
