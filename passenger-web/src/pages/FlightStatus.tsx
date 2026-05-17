import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFlights } from '../api';
import { Plane, AlertTriangle, Clock, RefreshCw, ArrowLeft } from 'lucide-react';

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  'On Time':  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.35)' },
  'Boarding': { color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.35)' },
  'Departed': { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' },
  'Delayed':  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.35)' },
  'Cancelled':{ color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.35)'  },
  'Diverted': { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.35)'  },
};

export default function FlightStatus() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const r = await getFlights(filter);
      setFlights(r.data?.flights || []);
      setSummary(r.data?.summary || {});
      setLastUpdate(new Date());
    } catch {/* silently fail */}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [filter]);

  const disrupted = flights.filter(f => ['Delayed', 'Cancelled', 'Diverted'].includes(f.status));

  return (
    <div className="mobile-container" style={{ maxWidth: 640 }}>
      <header className="page-header">
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="brand-title" style={{ fontSize: '1.3rem' }}>✈️ Flight Status</h1>
          <p className="brand-subtitle">San José International (SJC)</p>
        </div>
        <button onClick={load} style={{ background: 'none', border: 'none', color: '#0EA5E9', cursor: 'pointer' }}>
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </header>

      <div style={{ padding: '0 20px 40px' }}>
        {/* Disruption Banner */}
        {disrupted.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }} className="animate-fade-up">
            <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                {disrupted.length} flight{disrupted.length > 1 ? 's' : ''} affected
              </div>
              {disrupted.map(f => (
                <div key={f.sys_id} style={{ fontSize: '0.82rem', color: 'rgba(239,68,68,0.8)', marginBottom: 2 }}>
                  <strong>{f.flight_number}</strong> — {f.status}
                  {f.guidance && <span style={{ color: '#94A3B8' }}> · {f.guidance}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {[['On Time', summary.on_time, '#10B981'], ['Delayed', summary.delayed, '#F59E0B'], ['Cancelled', summary.cancelled, '#EF4444'], ['Boarding', summary.boarding, '#0EA5E9']].map(([l, v, c]) => (
            <div key={l as string} onClick={() => setFilter(filter === l ? '' : l as string)} style={{ background: filter === l ? `${c}20` : 'rgba(17,24,39,0.6)', border: `1px solid ${filter === l ? c : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', fontFamily: "'Outfit',sans-serif" }}>{v ?? 0}</div>
              <div style={{ fontSize: '0.7rem', color: c as string, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Last update */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Clock size={12} color="#64748B" />
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Updated {lastUpdate.toLocaleTimeString()}</span>
          {filter && <span style={{ fontSize: '0.75rem', color: '#0EA5E9', marginLeft: 8 }}>Filtered: {filter} <button onClick={() => setFilter('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', marginLeft: 2 }}>✕</button></span>}
        </div>

        {/* Flight Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: 40 }}>Loading flights...</div>
        ) : flights.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: 40 }}>No flights found.</div>
        ) : (
          flights.map((f: any) => {
            const s = STATUS_STYLE[f.status] || STATUS_STYLE['On Time'];
            return (
              <div key={f.sys_id} className="glass-panel animate-fade-up" style={{ borderRadius: 16, padding: 16, marginBottom: 12, borderLeft: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plane size={18} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1.05rem', fontFamily: "'Outfit',sans-serif" }}>{f.flight_number}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{f.airline}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '4px 12px', borderRadius: 20 }}>{f.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div><div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Route</div><div style={{ fontSize: '0.88rem', color: '#F8FAFC', fontWeight: 600 }}>{f.origin} → {f.destination}</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Departure</div><div style={{ fontSize: '0.88rem', color: '#F8FAFC', fontWeight: 600 }}>{f.scheduled_dep}</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Gate</div><div style={{ fontSize: '0.88rem', color: '#0EA5E9', fontWeight: 700 }}>{f.gate} · {f.terminal?.replace('Terminal ', 'T')}</div></div>
                </div>
                {f.guidance && (
                  <div style={{ marginTop: 10, background: `${s.color}08`, border: `1px solid ${s.color}25`, borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: s.color }}>
                    ℹ️ {f.guidance}
                  </div>
                )}
                {f.disruption_msg && !f.guidance && (
                  <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#94A3B8' }}>{f.disruption_msg}</div>
                )}
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
