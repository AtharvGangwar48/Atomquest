import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditTrail } from '../api';
import type { AuditLog } from '../types';

const ACTION_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  CREATE: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  UPDATE: { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
  DELETE: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const inputStyle: React.CSSProperties = {
  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '0.5rem 0.875rem', fontSize: '0.8125rem', color: '#0f172a',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
};

const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = '#4f46e5';
  (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
};
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = '#e2e8f0';
  (e.target as HTMLElement).style.boxShadow = 'none';
};

function DiffViewer({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  if (!value) return <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} style={{ fontSize: '0.75rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
        {open ? 'Hide' : 'View'} {label}
      </button>
      {open && (
        <pre style={{ marginTop: '0.375rem', fontSize: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', overflowX: 'auto', maxWidth: '200px', maxHeight: '120px', overflowY: 'auto', color: '#475569' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entityType, entityId, page],
    queryFn: () => getAuditTrail({ entityType: entityType || undefined, entityId: entityId || undefined, page, limit: 50 }),
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
      <h1 className="page-header" style={{ marginBottom: '1.5rem' }}>Audit Trail</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', padding: '1rem 1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} style={inputStyle} onFocus={focus} onBlur={blur}>
          <option value="">All Entity Types</option>
          {['Goal', 'GoalSheet', 'GoalActual'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <input type="text" placeholder="Filter by Entity ID…" value={entityId} onChange={(e) => { setEntityId(e.target.value); setPage(1); }}
          style={{ ...inputStyle, width: '280px' }} onFocus={focus} onBlur={blur} />
        {(entityType || entityId) && (
          <button onClick={() => { setEntityType(''); setEntityId(''); setPage(1); }}
            style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear filters
          </button>
        )}
        {data && <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto' }}>{data.total} records</span>}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: '#94a3b8' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 0.7s linear infinite' }} />
          Loading…
        </div>
      ) : (
        <>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Timestamp', 'Action', 'Entity', 'Entity ID', 'Changed By', 'Old Value', 'New Value'].map((h) => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No audit records found.</td></tr>
                  )}
                  {data?.logs.map((log: AuditLog) => {
                    const as_ = ACTION_STYLE[log.action] ?? ACTION_STYLE.UPDATE;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(log.changedAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: as_.bg, color: as_.color, border: `1px solid ${as_.border}` }}>{log.action}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{log.entityType}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{log.entityId.slice(0, 8)}…</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>{log.changer.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{log.changer.role}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}><DiffViewer label="old" value={log.oldValue} /></td>
                        <td style={{ padding: '0.75rem 1rem' }}><DiffViewer label="new" value={log.newValue} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {data && data.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost" style={{ fontSize: '0.8rem' }}>← Previous</button>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Page {page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
