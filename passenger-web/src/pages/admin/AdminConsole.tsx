import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminIncidents from './AdminIncidents';
import AdminWorkOrders from './AdminWorkOrders';
import AdminAuditLog from './AdminAuditLog';
import AdminFids from './AdminFids';
import AdminAnalytics from './AdminAnalytics';
import {
  LayoutDashboard, AlertCircle, ClipboardList, BarChart2,
  ScrollText, Plane, LogOut, Menu, X
} from 'lucide-react';

type Tab = 'dashboard' | 'incidents' | 'workorders' | 'analytics' | 'audit' | 'fids';

const NAV_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'incidents',  label: 'Incidents',     icon: AlertCircle },
  { id: 'workorders', label: 'Work Orders',   icon: ClipboardList },
  { id: 'analytics',  label: 'Analytics',     icon: BarChart2 },
  { id: 'audit',      label: 'Audit Log',     icon: ScrollText },
  { id: 'fids',       label: 'FIDS',          icon: Plane },
];

export default function AdminConsole() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = (_token: string, userData: any) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  if (!user) return <AdminLogin onLogin={handleLogin} />;

  const SIDEBAR_W = sidebarOpen ? 220 : 64;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#030712' }}>
      {/* Sidebar */}
      <div style={{ width: SIDEBAR_W, minHeight: '100vh', background: 'rgba(15,23,42,0.97)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', position: 'sticky', top: 0, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>✈️</div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC', fontFamily: "'Outfit',sans-serif" }}>Operations</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Console</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} id={`admin-nav-${id}`} onClick={() => setTab(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, marginBottom: 2, background: active ? 'rgba(14,165,233,0.15)' : 'transparent', border: active ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent', color: active ? '#0EA5E9' : '#64748B', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {sidebarOpen && <span style={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500 }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {sidebarOpen && (
            <div style={{ padding: '8px 10px', marginBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', color: '#F8FAFC', fontWeight: 600 }}>{user.display_name || user.username}</div>
              <div style={{ fontSize: '0.72rem', color: '#0EA5E9', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '0 28px', overflowY: 'auto', maxHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 0', marginBottom: 4, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Smart Airport Management &nbsp;/&nbsp; <span style={{ color: '#94A3B8' }}>{NAV_ITEMS.find(n => n.id === tab)?.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.25)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        {/* Page Content */}
        {tab === 'dashboard'  && <AdminDashboard  user={user} />}
        {tab === 'incidents'  && <AdminIncidents  user={user} />}
        {tab === 'workorders' && <AdminWorkOrders user={user} />}
        {tab === 'analytics'  && <AdminAnalytics  user={user} />}
        {tab === 'audit'      && <AdminAuditLog   user={user} />}
        {tab === 'fids'       && <AdminFids        user={user} />}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
