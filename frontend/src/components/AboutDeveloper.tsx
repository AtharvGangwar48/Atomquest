import { useState } from 'react';
import { X, Mail, Unlink } from 'lucide-react';

const GithubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const LINKS = [
  { href: 'https://github.com/atharvgangwar',          icon: <GithubIcon />,                                                    label: 'GitHub'    },
  { href: 'https://linkedin.com/in/atharvgangwar',     icon: <LinkedinIcon />,                                                  label: 'LinkedIn'  },
  { href: 'https://twitter.com/atharvgangwar',         icon: <TwitterIcon />,                                                   label: 'Twitter'   },
  { href: 'https://instagram.com/atharvgangwar',       icon: <InstagramIcon />,                                                 label: 'Instagram' },
  { href: 'https://linktr.ee/atharvgangwar',           icon: <Unlink size={14} />,                                              label: 'Linktree'  },
  { href: 'https://unstop.com/u/atharvgangwar',        icon: <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>Un</span>,  label: 'Unstop'    },
  { href: 'https://leetcode.com/atharvgangwar',        icon: <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700 }}>&lt;/&gt;</span>, label: 'LeetCode' },
  { href: 'mailto:atharvgangwar@gmail.com',            icon: <Mail size={14} />,                                                label: 'Email'     },
];

const linkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.4rem 0.8rem', borderRadius: '8px',
  background: '#f8fafc', border: '1px solid #e2e8f0',
  color: '#475569', fontSize: '0.775rem', fontWeight: 500,
  textDecoration: 'none', transition: 'all 0.15s',
};

function Modal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'fadeIn 0.2s ease-out', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '2rem 2rem 1.5rem', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.28)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <X size={16} />
          </button>

          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '3px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', marginBottom: '0.875rem' }}>
            👨‍💻
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Atharv Gangwar</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.2rem' }}>Full-Stack Developer · AtomQuest Hackathon 1.0</div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7, margin: '0 0 1.25rem' }}>
            Built this Goal Setting & Tracking Portal for AtomQuest Hackathon 1.0 — covers the full employee goal lifecycle from creation and approval to quarterly tracking and audit-ready reporting.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.375rem' }}>
            {['React 18', 'TypeScript', 'Node.js', 'PostgreSQL', 'Three.js', 'Prisma', 'JWT Auth', 'Vite'].map((t) => (
              <span key={t} style={{ fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '999px', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.125rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.75rem' }}>Connect</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {LINKS.map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  style={linkStyle}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#eef2ff'; el.style.borderColor = '#c7d2fe'; el.style.color = '#4f46e5'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#f8fafc'; el.style.borderColor = '#e2e8f0'; el.style.color = '#475569'; }}
                >
                  {icon} {label}
                </a>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', padding: '0.7rem 0.875rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              © {new Date().getFullYear()} Atharv Gangwar · All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutDeveloper() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.38rem 0.8rem', borderRadius: '8px', background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#eef2ff'; el.style.borderColor = '#c7d2fe'; el.style.color = '#4f46e5'; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b'; }}
      >
        <span style={{ fontSize: '0.82rem' }}>👨‍💻</span> About Developer
      </button>

      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
