import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackIncident } from '../api';
import { Plane, Search, ArrowLeft, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const stateMap: Record<string, { label: string; color: string; icon: any }> = {
  "1": { label: "New", color: "#F59E0B", icon: AlertCircle },
  "2": { label: "In Progress", color: "#0EA5E9", icon: Clock },
  "3": { label: "On Hold", color: "#64748B", icon: Clock },
  "6": { label: "Resolved", color: "#10B981", icon: CheckCircle },
  "7": { label: "Closed", color: "#64748B", icon: XCircle },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  "1": { label: "P1 Critical", color: "#EF4444" },
  "2": { label: "P2 High", color: "#F59E0B" },
  "3": { label: "P3 Medium", color: "#0EA5E9" },
  "4": { label: "P4 Low", color: "#10B981" },
};

export default function TrackIncident() {
  const navigate = useNavigate();
  const [incNumber, setIncNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await trackIncident(incNumber.trim().toUpperCase());
      const incidents = res.data?.result || [];
      if (incidents.length === 0) {
        setError('No incident found with that number. Please check and try again.');
      } else {
        setResult(incidents[0]);
      }
    } catch {
      setError('Could not connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const state = result ? stateMap[result.state] || stateMap["1"] : null;
  const priority = result ? priorityMap[result.priority] || priorityMap["3"] : null;
  const StateIcon = state?.icon;

  return (
    <div className="mobile-container">
      <header className="page-header">
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={20} /> Back
        </button>
      </header>

      <main style={{ padding: '0 20px 40px' }} className="animate-fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Search size={32} color="var(--color-primary)" />
          </div>
          <h1 className="brand-text" style={{ fontSize: '1.75rem', marginBottom: 8 }}>Track Your Issue</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Enter your incident number to check the status
          </p>
        </div>

        <form onSubmit={handleTrack} className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Incident Number
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="glass-input"
              style={{ paddingLeft: 40, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}
              placeholder="e.g. INC0010021"
              value={incNumber}
              onChange={e => setIncNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="glass-button" disabled={loading || !incNumber}>
            {loading ? 'Searching...' : 'Track Incident'} <Search size={18} />
          </button>
        </form>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 16, color: '#EF4444', display: 'flex', gap: 12, alignItems: 'center' }}>
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {result && state && priority && StateIcon && (
          <div className="glass-panel animate-fade-up" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Status Banner */}
            <div style={{ background: state.color + '20', borderBottom: `1px solid ${state.color}30`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <StateIcon size={24} color={state.color} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
                <p style={{ fontWeight: 800, color: state.color, fontSize: '1.1rem' }}>{state.label}</p>
              </div>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Incident number */}
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Incident Number</p>
                <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{result.number}</p>
              </div>

              {/* Description */}
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Issue</p>
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{result.short_description}</p>
              </div>

              {/* Priority + Created row */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 12, borderLeft: `3px solid ${priority.color}` }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Priority</p>
                  <p style={{ fontWeight: 700, color: priority.color }}>{priority.label}</p>
                </div>
                <div style={{ flex: 1, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Reported</p>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {result.sys_created_on ? new Date(result.sys_created_on + 'Z').toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              {/* Location */}
              {result.location && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Location</p>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{result.location}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
