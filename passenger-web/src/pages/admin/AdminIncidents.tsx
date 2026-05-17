import { useState, useEffect, useCallback } from 'react';
import { adminGetIncidents, adminUpdateIncident, adminExportCsv, adminExportPdf } from '../../api';
import { Search, Download } from 'lucide-react';

const P_COLORS: Record<string, string> = { '1': '#EF4444', '2': '#F59E0B', '3': '#0EA5E9', '4': '#10B981' };
const S_LABELS: Record<string, string> = { '1': 'New', '2': 'In Progress', '3': 'On Hold', '6': 'Resolved', '7': 'Closed' };

export default function AdminIncidents({ user }: { user: any }) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminGetIncidents(200, teamFilter); setIncidents(r.data?.result || []); }
    finally { setLoading(false); }
  }, [teamFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = incidents.filter(i =>
    !search || i.short_description?.toLowerCase().includes(search.toLowerCase()) || i.number?.toLowerCase().includes(search.toLowerCase())
  );

  const doExport = async (type: 'csv' | 'pdf') => {
    setExporting(type);
    try {
      const r = type === 'csv' ? await adminExportCsv('incidents') : await adminExportPdf('incidents');
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = Object.assign(document.createElement('a'), { href: url, download: `incidents.${type}` });
      a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(''); }
  };

  const updateState = async (sys_id: string, state: string) => {
    await adminUpdateIncident(sys_id, { state }); setSelected(null); load();
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>Incidents</h2>
          <p style={{ color: '#64748B', fontSize: '0.85rem' }}>{filtered.length} shown</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['csv','pdf'] as const).map(t => (
            <button key={t} onClick={() => doExport(t)} disabled={!!exporting} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, background: t==='csv'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', border: `1px solid ${t==='csv'?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, color: t==='csv'?'#10B981':'#EF4444', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
              <Download size={14}/> {exporting===t?'Exporting...':t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#64748B' }} />
          <input className="glass-input" style={{ paddingLeft:36, height:40 }} placeholder="Search incidents..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="glass-input" style={{ width:160, height:40 }} value={teamFilter} onChange={e=>setTeamFilter(e.target.value)} aria-label="Team Filter">
          {['','Electrical','Plumbing','Security','Facilities','IT','HR'].map(t=><option key={t} value={t}>{t||'All Teams'}</option>)}
        </select>
      </div>

      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div className="glass-panel" style={{ width:'100%', maxWidth:520, borderRadius:20, padding:26, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ color:'#0EA5E9', fontWeight:700 }}>{selected.number}</div>
                <div style={{ color:'#F8FAFC', fontWeight:700, fontSize:'1.05rem', marginTop:4 }}>{selected.short_description}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ padding:'4px 10px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'none', color:'#94A3B8', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[['Priority',`P${selected.priority}`],['Status',S_LABELS[selected.state]||selected.state],['Team',selected.u_department||'—'],['Location',selected.location||'—']].map(([l,v])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:10 }}>
                  <div style={{ fontSize:'0.72rem', color:'#64748B', textTransform:'uppercase', marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:'0.9rem', color:'#F8FAFC', fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:8, fontSize:'0.78rem', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em' }}>Update Status</div>
            <div style={{ display:'flex', gap:8 }}>
              {[['2','In Progress','#F59E0B'],['6','Resolved','#10B981'],['3','On Hold','#8B5CF6']].map(([s,l,c])=>(
                <button key={s} onClick={()=>updateState(selected.sys_id,s)} style={{ padding:'6px 12px', borderRadius:8, background:`${c}15`, border:`1px solid ${c}40`, color:c, cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background:'rgba(17,24,39,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden' }}>
        {loading ? <div style={{ textAlign:'center', color:'#64748B', padding:40 }}>Loading...</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.86rem' }}>
              <thead><tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                {['Number','Description','Priority','Status','Team','Created'].map(h=>(
                  <th key={h} style={{ textAlign:'left', color:'#64748B', fontWeight:600, padding:'12px 14px', fontSize:'0.75rem', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((inc:any)=>(
                  <tr key={inc.sys_id} onClick={()=>setSelected(inc)} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(14,165,233,0.06)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{ padding:'10px 14px', color:'#0EA5E9', fontWeight:600 }}>{inc.number||'N/A'}</td>
                    <td style={{ padding:'10px 14px', color:'#F8FAFC', maxWidth:280 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inc.short_description}</div></td>
                    <td style={{ padding:'10px 14px' }}><span style={{ color:P_COLORS[inc.priority]||'#94A3B8', fontWeight:700 }}>P{inc.priority}</span></td>
                    <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'0.76rem', color:'#94A3B8', background:'rgba(148,163,184,0.1)', padding:'2px 8px', borderRadius:20 }}>{S_LABELS[inc.state]||inc.state}</span></td>
                    <td style={{ padding:'10px 14px', color:'#94A3B8' }}>{inc.u_department||'—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748B', fontSize:'0.78rem' }}>{inc.sys_created_on?.slice(0,10)||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length===0&&<div style={{ textAlign:'center', color:'#64748B', padding:24 }}>No incidents found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
