import { useState } from 'react';
import { adminLogin } from '../../api';
import { Lock, User, Plane } from 'lucide-react';

interface Props { onLogin: (token: string, user: any) => void; }

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      const { access_token, role } = res.data;
      if (!['admin', 'manager'].includes(role)) {
        setError('Access denied. Admin or Manager role required.');
        return;
      }
      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify(res.data));
      onLogin(access_token, res.data);
    } catch {
      setError('Invalid credentials. Try admin/admin or manager/manager.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(14,165,233,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 40%)', pointerEvents: 'none' }} />
      
      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(14,165,233,0.15)', border: '1.5px solid rgba(14,165,233,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>
            ✈️
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 4 }}>Operations Console</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Smart Airport Management — Admin Portal</p>
        </div>

        <div className="glass-panel" style={{ padding: 32, borderRadius: 20 }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input id="admin-username" type="text" className="glass-input" style={{ paddingLeft: 42 }} placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input id="admin-password" type="password" className="glass-input" style={{ paddingLeft: 42 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#EF4444', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            <button id="admin-login-btn" type="submit" className="glass-button" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(14,165,233,0.07)', borderRadius: 10, border: '1px solid rgba(14,165,233,0.15)' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 6, fontWeight: 600 }}>DEV CREDENTIALS</p>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Admin: <code style={{ color: '#0EA5E9' }}>admin / admin</code></p>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Manager: <code style={{ color: '#0EA5E9' }}>manager / manager</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
