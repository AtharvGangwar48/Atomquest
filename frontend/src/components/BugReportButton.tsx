import { useState } from 'react';
import { Bug } from 'lucide-react';

export default function BugReportButton() {
  const [hovered, setHovered] = useState(false);
  const issueUrl = 'https://github.com/atharvgangwar/Atomquest';

  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Report a bug on GitHub"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: hovered ? '0.5rem' : '0',
        padding: hovered ? '0.6rem 1rem' : '0.6rem',
        borderRadius: '999px',
        background: hovered ? '#fef2f2' : '#ffffff',
        border: `1px solid ${hovered ? '#fecaca' : '#e2e8f0'}`,
        color: hovered ? '#dc2626' : '#94a3b8',
        boxShadow: hovered ? '0 4px 16px rgba(220,38,38,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <Bug size={17} strokeWidth={2} />
      <span style={{
        fontSize: '0.775rem',
        fontWeight: 600,
        maxWidth: hovered ? '120px' : '0',
        opacity: hovered ? 1 : 0,
        transition: 'max-width 0.2s ease, opacity 0.15s ease',
        overflow: 'hidden',
      }}>
        Report a Bug
      </span>
    </a>
  );
}
