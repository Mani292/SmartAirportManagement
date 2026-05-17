import { useState, useEffect, useCallback } from 'react';
import { adminGetFlights, adminUpdateFlight, adminCreateDisruption } from '../../api';
import { AlertTriangle, Plane } from 'lucide-react';

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  'On Time':  { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  'Boarding': { color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  'Delayed':  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'Cancelled':{ color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'Diverted': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'Departed': { color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

export default function AdminFids({ user }: { user: any }) {
  const [flights, setFlights] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [disruption, setDisruption] = useState({ type: 'Delayed', status: 'Delayed', msg: '', flight_sys_id: '' });
  const [showDisruption, setShowDisruption] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminGetFlights();
      setFlights(r.data?.flights || []);
      setSummary(r.data?.summary || {});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const handleStatusUpdate = async (sys_id: string, status: string, gate?: string) => {
    setSaving(true);
    try { await adminUpdateFlight(sys_id, { status, ...(gate ? { gate } : {}) }); await load(); setSelected(null); }
    finally { setSaving(false); }
  };

  const handleDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateDisruption({ flight_sys_id: disruption.flight_sys_id, disruption_type: disruption.type, disruption_msg: disruption.msg, new_status: disruption.status });
      setShowDisruption(false);
      await load();
    } finally { setSaving(false); }
  };

  const ss = (s: string) => STATUS_STYLES[s] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>FIDS — Flight Board</h2>
          <p style={{ color: '#64748B', fontSize: '0.85rem' }}>San José Mineta Airport (SJC) · Auto-refreshes every 60s</p>
        </div>
        <button onClick={() => setShowDisruption(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
          <AlertTriangle size={15} /> Disruption Alert
        </button>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['Total', summary.total, '#94A3B8'],['On Time', summary.on_time, '#10B981'],['Delayed', summary.delayed, '#F59E0B'],['Cancelled', summary.cancelled, '#EF4444'],['Boarding', summary.boarding, '#0EA5E9']].map(([l,v,c])=>(
          <div key={l as string} style={{ background:`${c}12`, border:`1px solid ${c}30`, borderRadius:10, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:'0.78rem', color: c as string, fontWeight:700 }}>{l}</span>
            <span style={{ fontSize:'1.2rem', fontWeight:800, color:'#F8FAFC', fontFamily:"'Outfit',sans-serif" }}>{v ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Disruption Modal */}
      {showDisruption && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div className="glass-panel" style={{ width:'100%', maxWidth:480, borderRadius:20, padding:28 }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:700, color:'#EF4444', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}><AlertTriangle size={18}/>Create Disruption Alert</h3>
            <form onSubmit={handleDisruption} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <select className="glass-input" value={disruption.flight_sys_id} onChange={e=>setDisruption(d=>({...d,flight_sys_id:e.target.value}))} aria-label="Select Flight" required>
                <option value="">Select Flight...</option>
                {flights.map((f:any)=><option key={f.sys_id} value={f.sys_id}>{f.flight_number} — {f.origin}→{f.destination} ({f.scheduled_dep})</option>)}
              </select>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <select className="glass-input" value={disruption.type} onChange={e=>setDisruption(d=>({...d,type:e.target.value}))} aria-label="Disruption Type">
                  {['Weather','Mechanical','ATC','Security','Operational'].map(t=><option key={t}>{t}</option>)}
                </select>
                <select className="glass-input" value={disruption.status} onChange={e=>setDisruption(d=>({...d,status:e.target.value}))} aria-label="New Status">
                  {['Delayed','Cancelled','Diverted'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <textarea className="glass-input" rows={2} placeholder="Disruption message for passengers..." value={disruption.msg} onChange={e=>setDisruption(d=>({...d,msg:e.target.value}))} required style={{ resize:'none' }} />
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={saving} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', color:'#EF4444', fontWeight:700, cursor:'pointer' }}>{saving?'Publishing...':'Publish Alert'}</button>
                <button type="button" onClick={()=>setShowDisruption(false)} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#94A3B8', cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flight Table */}
      <div style={{ background:'rgba(17,24,39,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden' }}>
        {loading ? <div style={{ textAlign:'center', color:'#64748B', padding:40 }}>Loading flight board...</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.86rem' }}>
              <thead><tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                {['Flight','Airline','Route','Scheduled','Gate','Terminal','Status','Action'].map(h=>(
                  <th key={h} style={{ textAlign:'left', color:'#64748B', fontWeight:600, padding:'12px 14px', fontSize:'0.75rem', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {flights.map((f:any)=>{
                  const s=ss(f.status);
                  return (
                    <tr key={f.sys_id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'10px 14px', fontWeight:700, color:'#F8FAFC', display:'flex', alignItems:'center', gap:8 }}><Plane size={14} color="#0EA5E9"/>{f.flight_number}</td>
                      <td style={{ padding:'10px 14px', color:'#94A3B8', fontSize:'0.82rem' }}>{f.airline}</td>
                      <td style={{ padding:'10px 14px', color:'#94A3B8' }}>{f.origin}→{f.destination}</td>
                      <td style={{ padding:'10px 14px', color:'#64748B', fontSize:'0.82rem' }}>{f.scheduled_dep} / {f.scheduled_arr}</td>
                      <td style={{ padding:'10px 14px', color:'#F8FAFC', fontWeight:600 }}>{f.gate}</td>
                      <td style={{ padding:'10px 14px', color:'#94A3B8', fontSize:'0.82rem' }}>{f.terminal}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ fontSize:'0.78rem', fontWeight:700, color:s.color, background:s.bg, padding:'3px 10px', borderRadius:20 }}>{f.status}</span>
                        {f.disruption_msg&&<div style={{ fontSize:'0.72rem', color:'#64748B', marginTop:3, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.disruption_msg}</div>}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          {['Boarding','Departed'].map(ns=>(
                            <button key={ns} onClick={()=>handleStatusUpdate(f.sys_id,ns)} style={{ padding:'4px 8px', borderRadius:7, background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', color:'#0EA5E9', cursor:'pointer', fontSize:'0.72rem' }}>{ns}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
