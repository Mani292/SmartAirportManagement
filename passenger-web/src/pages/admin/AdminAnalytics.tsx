import { useState, useEffect, useCallback } from 'react';
import { adminGetReport, adminExportCsv, adminExportPdf } from '../../api';
import { Download, BarChart2, TrendingUp, Shield } from 'lucide-react';

export default function AdminAnalytics(_props: { user: any }) {

  const [slaData, setSlaData] = useState<any>(null);
  const [incData, setIncData] = useState<any>(null);

  const [woData, setWoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, iRes, wRes] = await Promise.allSettled([
        adminGetReport('sla'), adminGetReport('incidents'), adminGetReport('workorders'),
      ]);
      if (sRes.status === 'fulfilled') setSlaData(sRes.value.data);
      if (iRes.status === 'fulfilled') setIncData(iRes.value.data);
      if (wRes.status === 'fulfilled') setWoData(wRes.value.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doExport = async (report: string, type: 'csv' | 'pdf') => {
    setExporting(`${report}-${type}`);
    try {
      const r = type === 'csv' ? await adminExportCsv(report) : await adminExportPdf(report);
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = Object.assign(document.createElement('a'), { href: url, download: `${report}.${type}` });
      a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(''); }
  };

  const sla = slaData || {};
  const inc = incData || {};
  const wo = woData || {};

  const Section = ({ title, icon: Icon, color, children }: any) => (
    <div style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={color} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', fontFamily: "'Outfit',sans-serif" }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['csv','pdf'] as const).map(t => (
            <button key={t} onClick={() => doExport(title.toLowerCase().replace(/ .*/,''), t)} disabled={!!exporting}
              style={{ padding: '5px 10px', borderRadius: 8, background: t==='csv'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', border: `1px solid ${t==='csv'?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, color: t==='csv'?'#10B981':'#EF4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Download size={11}/>{t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );

  const MetricRow = ({ label, value, color }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#94A3B8', fontSize: '0.88rem' }}>{label}</span>
      <span style={{ color: color || '#F8FAFC', fontWeight: 700, fontSize: '0.95rem' }}>{value}</span>
    </div>
  );

  const BarRow = ({ label, pct, color, total }: any) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', color, fontWeight: 700 }}>{total}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', color: '#64748B', padding: 60 }}>Loading analytics...</div>;

  const totalInc = inc.total || 1;
  const teamRows = (inc.team_breakdown || []).slice(0, 6);
  const priorityRows = inc.priority_breakdown || [];

  return (
    <div style={{ padding: '24px 0' }}>
      <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 6 }}>Analytics & Reports</h2>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 24 }}>Exportable KPIs · IATA-aligned SLA thresholds</p>

      {/* SLA Report */}
      <Section title="SLA Compliance" icon={Shield} color="#10B981">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <MetricRow label="Overall Compliance" value={`${sla.sla_compliance_pct || 100}%`} color={sla.sla_compliance_pct >= 95 ? '#10B981' : '#F59E0B'} />
            <MetricRow label="Total Incidents" value={sla.total_incidents || 0} />
            <MetricRow label="Resolved" value={sla.resolved_incidents || 0} />
            <MetricRow label="SLA Breaches" value={sla.sla_breach_count || 0} color={sla.sla_breach_count > 0 ? '#EF4444' : '#10B981'} />
            <MetricRow label="MTTR" value={`${sla.mttr_hours || 0} hrs`} color="#8B5CF6" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>SLA Thresholds</div>
            {[['P1 Critical','30 min'],['P2 High','2 hrs'],['P3 Medium','4 hrs'],['P4 Low','8 hrs']].map(([p,t])=>(
              <div key={p} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:'0.84rem', color:'#94A3B8' }}>{p}</span>
                <span style={{ fontSize:'0.84rem', color:'#0EA5E9', fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        {(sla.breaches || []).length > 0 && (
          <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.07)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 700, marginBottom: 10 }}>SLA BREACHES</div>
            {(sla.breaches || []).slice(0, 5).map((b: any, i: number) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: 6 }}>
                {b.number} · P{b.priority} · {b.team} · breached by <span style={{ color: '#EF4444', fontWeight: 700 }}>{b.breach_by_mins}min</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Incident Report */}
      <Section title="Incidents" icon={BarChart2} color="#0EA5E9">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>By Priority</div>
            {priorityRows.map((p: any) => (
              <BarRow key={p.priority} label={`P${p.priority} ${p.label}`} total={p.total} pct={totalInc > 0 ? (p.total / totalInc) * 100 : 0} color={['#EF4444','#F59E0B','#0EA5E9','#10B981','#64748B'][+p.priority - 1]} />
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>By Team</div>
            {teamRows.map((t: any) => (
              <BarRow key={t.team} label={t.team} total={t.total} pct={totalInc > 0 ? (t.total / totalInc) * 100 : 0} color="#0EA5E9" />
            ))}
          </div>
        </div>
      </Section>

      {/* Work Orders */}
      <Section title="Work Orders" icon={TrendingUp} color="#8B5CF6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {Object.entries(wo.status_summary || {}).map(([status, count]) => (
            <div key={status} style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC', fontFamily: "'Outfit',sans-serif" }}>{count as number}</div>
              <div style={{ fontSize: '0.78rem', color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>{status.replace('_', ' ')}</div>
            </div>
          ))}
          {Object.keys(wo.status_summary || {}).length === 0 && (
            <div style={{ color: '#64748B', fontSize: '0.88rem', gridColumn: '1/-1', textAlign: 'center', padding: 20 }}>No work orders yet. Create one from the Work Orders tab.</div>
          )}
        </div>
      </Section>
    </div>
  );
}
