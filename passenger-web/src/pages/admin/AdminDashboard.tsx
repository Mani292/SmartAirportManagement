import { useState, useEffect, useCallback } from 'react';
import { adminGetMetrics, adminGetIncidents, adminGetWorkOrders, adminGetShifts } from '../../api';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Zap, Users, TrendingUp, Activity } from 'lucide-react';

interface Props { user: any; }

const KpiCard = ({ title, value, sub, color, icon: Icon }: any) => (
  <div style={{ background: 'rgba(17,24,39,0.7)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, borderRadius: '0 0 0 80px' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F8FAFC', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 6 }}>{sub}</div>}
  </div>
);

export default function AdminDashboard({ user }: Props) {
  const [metrics, setMetrics] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [workorders, setWorkorders] = useState<any[]>([]);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, iRes, wRes, sRes] = await Promise.allSettled([
        adminGetMetrics(),
        adminGetIncidents(50),
        adminGetWorkOrders(),
        adminGetShifts(new Date().toISOString().split('T')[0]),
      ]);
      if (mRes.status === 'fulfilled') setMetrics(mRes.value.data);
      if (iRes.status === 'fulfilled') setIncidents(iRes.value.data?.result || []);
      if (wRes.status === 'fulfilled') setWorkorders(wRes.value.data?.result || []);
      if (sRes.status === 'fulfilled') setTodayShifts(sRes.value.data?.result || []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const m = metrics?.metrics || {};
  const health = metrics?.airport_health || {};
  const recentInc = incidents.slice(0, 8);
  const openWO = workorders.filter((w: any) => !['closed', 'cancelled'].includes(w.status)).length;
  const pendingApproval = workorders.filter((w: any) => w.approval_status === 'pending').length;

  const healthColor = (z: string) => z === 'Red' ? '#EF4444' : z === 'Yellow' ? '#F59E0B' : '#10B981';
  const stateLabel: Record<string, string> = { '1': 'New', '2': 'In Progress', '3': 'On Hold', '6': 'Resolved', '7': 'Closed' };
  const priorityColors: Record<string, string> = { '1': '#EF4444', '2': '#F59E0B', '3': '#0EA5E9', '4': '#10B981' };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>Operations Dashboard</h2>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>Live data · refreshed {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0EA5E9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Safety Banner */}
      {(m.critical_incidents || 0) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14, padding: '12px 18px', marginBottom: 24 }}>
          <AlertTriangle size={20} color="#EF4444" />
          <div>
            <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.95rem' }}>{m.critical_incidents} Critical Incident{m.critical_incidents > 1 ? 's' : ''} Active</div>
            <div style={{ color: 'rgba(239,68,68,0.7)', fontSize: '0.8rem' }}>Immediate response required</div>
          </div>
          <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 0 4px rgba(239,68,68,0.25)', animation: 'pulse 2s infinite' }} />
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <KpiCard title="Total Incidents" value={m.total_incidents || 0} sub="All time" color="#0EA5E9" icon={Activity} />
        <KpiCard title="Active" value={m.active_incidents || 0} sub="Open / In Progress" color="#F59E0B" icon={Zap} />
        <KpiCard title="Resolved" value={m.resolved_incidents || 0} sub="Closed successfully" color="#10B981" icon={CheckCircle} />
        <KpiCard title="Critical" value={m.critical_incidents || 0} sub="P1 priority" color="#EF4444" icon={AlertTriangle} />
        <KpiCard title="MTTR" value={`${m.mean_time_to_resolution_hrs || 0}h`} sub="Mean time to resolve" color="#8B5CF6" icon={Clock} />
        <KpiCard title="Open Work Orders" value={openWO} sub={`${pendingApproval} pending approval`} color="#06B6D4" icon={TrendingUp} />
        <KpiCard title="Staff On Shift" value={todayShifts.filter((s: any) => s.status === 'active').length} sub={`${todayShifts.length} total shifts`} color="#F59E0B" icon={Users} />
        <KpiCard title="SLA Compliance" value={m.sla_compliance_rate || '100%'} sub="IATA target: 95%" color="#10B981" icon={CheckCircle} />
      </div>

      {/* Airport Health + SLA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Zone Health */}
        <div style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Zone Health</h3>
          {Object.entries(health).map(([zone, status]) => (
            <div key={zone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>{zone.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: healthColor(status as string), background: `${healthColor(status as string)}18`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${healthColor(status as string)}35` }}>{status as string}</span>
            </div>
          ))}
        </div>
        {/* SLA Bar */}
        <div style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>SLA Compliance</h3>
          {[
            { label: 'P1 Critical (30min)', pct: 92 },
            { label: 'P2 High (2hr)', pct: 87 },
            { label: 'P3 Medium (4hr)', pct: 95 },
            { label: 'P4 Low (8hr)', pct: 98 },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{s.label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.pct >= 95 ? '#10B981' : '#F59E0B' }}>{s.pct}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: s.pct >= 95 ? '#10B981' : '#F59E0B', borderRadius: 3, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Recent Incidents</h3>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: 20 }}>Loading...</div>
        ) : recentInc.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#10B981', padding: 20 }}>✓ No active incidents</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {['Number', 'Description', 'Priority', 'Status', 'Team', 'Created'].map(h => (
                    <th key={h} style={{ textAlign: 'left', color: '#64748B', fontWeight: 600, padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInc.map((inc: any) => (
                  <tr key={inc.sys_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', color: '#0EA5E9', fontWeight: 600 }}>{inc.number || 'N/A'}</td>
                    <td style={{ padding: '10px', color: '#F8FAFC', maxWidth: 280 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.short_description}</div></td>
                    <td style={{ padding: '10px' }}><span style={{ color: priorityColors[inc.priority] || '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>P{inc.priority}</span></td>
                    <td style={{ padding: '10px' }}><span style={{ fontSize: '0.78rem', color: '#94A3B8', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: 20 }}>{stateLabel[inc.state] || inc.state}</span></td>
                    <td style={{ padding: '10px', color: '#94A3B8' }}>{inc.u_department || inc.assigned_to || '—'}</td>
                    <td style={{ padding: '10px', color: '#64748B', fontSize: '0.78rem' }}>{inc.sys_created_on?.slice(0, 10) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
