export default function AboutDeveloper() {
  return (
    <a
      href="https://atharvgangwar.netlify.app"
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.38rem 0.8rem', borderRadius: '8px', background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textDecoration: 'none' }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#eef2ff'; el.style.borderColor = '#c7d2fe'; el.style.color = '#4f46e5'; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b'; }}
    >
      About Developer
    </a>
  );
}
