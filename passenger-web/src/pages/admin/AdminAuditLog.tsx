import { useState, useEffect, useCallback } from 'react';
import { adminGetAuditLogs } from '../../api';
import { Search } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#10B981', UPDATE: '#0EA5E9', DELETE: '#EF4444',
  LOGIN: '#8B5CF6', RESOLVE: '#10B981', APPROVE: '#10B981', REJECT: '#EF4444',
  IOT: '#F59E0B', SHIFT: '#06B6D4',
};
function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.toUpperCase().includes(key)) return color;
  }
  return '#94A3B8';
}

export default function AdminAuditLog({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminGetAuditLogs(actorFilter, actionFilter, 200); setLogs(r.data?.logs || []); }
    finally { setLoading(false); }
  }, [actorFilter, actionFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>Audit Log</h2>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>{logs.length} entries · Complete tamper-evident trail</p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input className="glass-input" style={{ paddingLeft: 36, height: 40 }} placeholder="Filter by actor..." value={actorFilter} onChange={e => setActorFilter(e.target.value)} />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input className="glass-input" style={{ paddingLeft: 36, height: 40 }} placeholder="Filter by action..." value={actionFilter} onChange={e => setActionFilter(e.target.value)} />
        </div>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0EA5E9', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Apply</button>
      </div>
      <div style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? <div style={{ textAlign: 'center', color: '#64748B', padding: 40 }}>Loading audit log...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Timestamp', 'Actor', 'Action', 'Details'].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: '#64748B', fontWeight: 600, padding: '12px 14px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {logs.map((l: any, idx: number) => (
                  <tr key={l.sys_id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{l.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.85rem' }}>{l.actor}</span></td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: getActionColor(l.action), background: `${getActionColor(l.action)}15`, padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace' }}>{l.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94A3B8', fontSize: '0.82rem', maxWidth: 400 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <div style={{ textAlign: 'center', color: '#64748B', padding: 24 }}>No audit entries found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
