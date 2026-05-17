import { useState, useEffect, useCallback } from 'react';
import { adminGetWorkOrders, adminCreateWorkOrder, adminApproveWorkOrder, adminUpdateWorkOrder, adminGetIncidents } from '../../api';
import { Plus, Check, X, ChevronDown } from 'lucide-react';

interface Props { user: any; }

const STATUS_COLORS: Record<string, string> = {
  open: '#0EA5E9', in_progress: '#F59E0B', pending_approval: '#8B5CF6',
  approved: '#10B981', rejected: '#EF4444', closed: '#64748B',
};
const COLUMNS = ['open', 'in_progress', 'pending_approval', 'approved', 'closed'];
const COL_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', pending_approval: 'Pending Approval',
  approved: 'Approved', closed: 'Closed',
};

export default function AdminWorkOrders({ user }: Props) {
  const [workorders, setWorkorders] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [approvalModal, setApprovalModal] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', assigned_team: 'Facilities', priority: '3', sn_incident_sys_id: '', location: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, iRes] = await Promise.allSettled([adminGetWorkOrders(), adminGetIncidents(50)]);
      if (wRes.status === 'fulfilled') setWorkorders(wRes.value.data?.result || []);
      if (iRes.status === 'fulfilled') setIncidents(iRes.value.data?.result || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminCreateWorkOrder({ ...form, requires_approval: true });
    setShowCreate(false);
    setForm({ title: '', description: '', assigned_team: 'Facilities', priority: '3', sn_incident_sys_id: '', location: '' });
    load();
  };

  const handleApprove = async (action: string) => {
    await adminApproveWorkOrder(approvalModal.sys_id, action, approvalModal.notes || '');
    setApprovalModal(null);
    load();
  };

  const handleStatusUpdate = async (sys_id: string, status: string) => {
    await adminUpdateWorkOrder(sys_id, { status });
    load();
  };

  const woByCols = COLUMNS.reduce((acc, col) => {
    acc[col] = workorders.filter((w: any) => w.status === col);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>Work Orders</h2>
          <p style={{ color: '#64748B', fontSize: '0.85rem' }}>{workorders.length} total · Kanban board view</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
          <Plus size={16} /> New Work Order
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 520, borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: 20, color: '#F8FAFC' }}>Create Work Order</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input className="glass-input" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea className="glass-input" rows={2} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select className="glass-input" value={form.assigned_team} onChange={e => setForm(f => ({ ...f, assigned_team: e.target.value }))} aria-label="Assign Team">
                  {['Electrical','Plumbing','Security','Facilities','IT','HR'].map(t => <option key={t}>{t}</option>)}
                </select>
                <select className="glass-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} aria-label="Priority">
                  <option value="1">P1 - Critical</option>
                  <option value="2">P2 - High</option>
                  <option value="3">P3 - Medium</option>
                  <option value="4">P4 - Low</option>
                </select>
              </div>
              <input className="glass-input" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              <select className="glass-input" value={form.sn_incident_sys_id} onChange={e => setForm(f => ({ ...f, sn_incident_sys_id: e.target.value }))} aria-label="Link Incident">
                <option value="">— Link to Incident (optional) —</option>
                {incidents.map((i: any) => <option key={i.sys_id} value={i.sys_id}>{i.number} — {i.short_description?.slice(0, 50)}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 440, borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Approve / Reject</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: 16 }}>{approvalModal.title}</p>
            <textarea className="glass-input" rows={2} placeholder="Optional notes..." style={{ resize: 'none', marginBottom: 14 }} onChange={e => setApprovalModal((m: any) => ({ ...m, notes: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleApprove('approve')} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10B981', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Check size={16} /> Approve</button>
              <button onClick={() => handleApprove('reject')} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={16} /> Reject</button>
              <button onClick={() => setApprovalModal(null)} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748B', padding: 40 }}>Loading work orders...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, overflowX: 'auto', minWidth: 900 }}>
          {COLUMNS.map(col => (
            <div key={col} style={{ minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[col] }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{COL_LABELS[col]}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748B', background: 'rgba(255,255,255,0.07)', padding: '1px 7px', borderRadius: 20 }}>{woByCols[col].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {woByCols[col].map((wo: any) => (
                  <div key={wo.sys_id} style={{ background: 'rgba(17,24,39,0.85)', border: `1px solid ${STATUS_COLORS[wo.status]}25`, borderLeft: `3px solid ${STATUS_COLORS[wo.status]}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: '0.75rem', color: STATUS_COLORS[wo.status], fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>P{wo.priority} · {wo.assigned_team}</div>
                    <div style={{ fontSize: '0.88rem', color: '#F8FAFC', fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{wo.title}</div>
                    {wo.location && <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 8 }}>📍 {wo.location}</div>}
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: 10 }}>{wo.created_at?.slice(0, 10)}</div>
                    {/* Actions */}
                    {col === 'pending_approval' && user?.role === 'admin' && (
                      <button onClick={() => setApprovalModal(wo)} style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#8B5CF6', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Review Approval</button>
                    )}
                    {col === 'open' && (
                      <button onClick={() => handleStatusUpdate(wo.sys_id, 'in_progress')} style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Start Work</button>
                    )}
                    {col === 'approved' && (
                      <button onClick={() => handleStatusUpdate(wo.sys_id, 'closed')} style={{ width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Close</button>
                    )}
                  </div>
                ))}
                {woByCols[col].length === 0 && (
                  <div style={{ textAlign: 'center', color: '#374151', fontSize: '0.8rem', padding: '20px 10px', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10 }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
