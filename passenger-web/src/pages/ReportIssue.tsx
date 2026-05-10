import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { reportIncident } from '../api';
import { MapPin, Send, MessageSquare, AlertCircle, Phone, Mail } from 'lucide-react';

export default function ReportIssue() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const locationParam = params.get('location') || '';
  const areaParam = params.get('area') || '';
  
  const [desc, setDesc] = useState('');
  const [problemType, setProblemType] = useState('General');
  const [location, setLocation] = useState(locationParam);
  const [area, setArea] = useState(areaParam);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !location || !area) return;
    
    setLoading(true);
    try {
      const fullDesc = `[${problemType}] ${desc}`;
      const res = await reportIncident({
        short_description: fullDesc,
        location,
        area,
        reported_via: 'Web_QR',
        reporter_phone: phone,
        reporter_email: email
      });
      setSuccess(res.data);
    } catch (err) {
      alert("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const incNumber = success.incident_number || success.incident?.result?.number || 'INC-PENDING';
    const triage = success.ai_triage;
    const teamColors: Record<string, string> = {
      Electrical: '#EAB308', Plumbing: '#3B82F6', Security: '#EF4444',
      Facilities: '#8B5CF6', IT: '#06B6D4', HR: '#EC4899', General: '#10B981'
    };
    const teamColor = teamColors[triage?.assigned_team] || '#0EA5E9';
    
    return (
      <div className="mobile-container animate-fade-up" style={{ justifyContent: 'center', padding: 24 }}>
        <div className="glass-panel" style={{ padding: 32, borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          {/* Success icon */}
          <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 }}>✓</span>
          </div>
          <h2 className="brand-text" style={{ fontSize: '1.75rem', marginBottom: 8, color: '#10B981' }}>Issue Reported!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            Our team has been notified and is on the way.
          </p>
          
          {/* Incident number */}
          <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Your Incident Number</p>
            <p className="brand-text" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0EA5E9', letterSpacing: '0.1em' }}>{incNumber}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Save this to track your issue</p>
          </div>

          {/* AI Triage */}
          {triage && (
            <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: 20, overflow: 'hidden', borderLeft: `4px solid ${teamColor}` }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem' }}>⚡ AeroBot Triage</p>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Assigned Team</span>
                  <span style={{ color: teamColor, fontWeight: 700, fontSize: '0.85rem' }}>{triage.assigned_team}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Est. Fix Time</span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{triage.estimated_fix_mins} mins</span>
                </div>
                {triage.safety_risk && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>⚠️</span>
                    <span style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 600 }}>Safety risk flagged — priority response</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          {(success.notifications?.email_sent || success.notifications?.whatsapp_sent) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {success.notifications.email_sent && (
                <span style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', gap: 8, alignItems: 'center' }}>
                  ✓ Email confirmation sent
                </span>
              )}
              {success.notifications.whatsapp_sent && (
                <span style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', gap: 8, alignItems: 'center' }}>
                  ✓ WhatsApp updates active
                </span>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="glass-button"
              style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', color: '#0EA5E9' }}
              onClick={() => navigate(`/track?number=${incNumber}`)}
            >
              🔍 Track My Issue
            </button>
            <button className="glass-button" onClick={() => { setSuccess(null); setDesc(''); setProblemType('General'); }}>
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="mobile-container">
      <header className="page-header">
        <div className="brand-icon">✈️</div>
        <div>
          <h1 className="brand-title">Smart Airport</h1>
          <p className="brand-subtitle">Passenger Portal</p>
        </div>
      </header>
      
      <main style={{ padding: '0 20px 40px' }} className="animate-fade-up">
        
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={20} color="var(--color-primary)" />
            Report an Issue
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Type of Problem</label>
              <select
                className="glass-input"
                value={problemType}
                onChange={e => setProblemType(e.target.value)}
                style={{ padding: '12px', width: '100%', appearance: 'none', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                title="Select Type of Problem"
                aria-label="Select Type of Problem"
              >
                <option value="General">General / Other</option>
                <option value="Restroom">Restroom / Hygiene</option>
                <option value="Security">Security / Safety</option>
                <option value="Electrical">Electrical / Lighting</option>
                <option value="Plumbing">Plumbing / Water</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Description</label>
              <textarea 
                className="glass-input" 
                rows={3} 
                placeholder="What exactly is broken or needs attention?"
                value={desc} onChange={e => setDesc(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 16, color: 'var(--color-text-muted)' }} />
                  <input 
                    type="text" className="glass-input" style={{ paddingLeft: 36 }}
                    placeholder="Terminal 1"
                    value={location} onChange={e => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Specific Area</label>
                <input 
                  type="text" className="glass-input"
                  placeholder="Gate 4"
                  value={area} onChange={e => setArea(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 0' }} />
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Receive Updates via WhatsApp (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 12, top: 16, color: 'var(--color-text-muted)' }} />
                <input 
                  type="tel" className="glass-input" style={{ paddingLeft: 36 }}
                  placeholder="+1234567890"
                  value={phone} onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Receive Email Confirmation (Optional)</label>
              <div style={{ position: 'relative' }}>
                 <Mail size={16} style={{ position: 'absolute', left: 12, top: 16, color: 'var(--color-text-muted)' }} />
                 <input 
                   type="email" className="glass-input" style={{ paddingLeft: 36 }}
                   placeholder="you@example.com"
                   value={email} onChange={e => setEmail(e.target.value)}
                 />
              </div>
            </div>
            
            <button type="submit" className="glass-button" style={{ marginTop: 8 }} disabled={loading || !desc || !location || !area}>
              {loading ? 'Submitting...' : 'Submit Report'} <Send size={18} />
            </button>
          </form>
        </div>
        
        {/* Floating Chat Button */}
        <div className="fab" onClick={() => navigate('/chat')}>
          <MessageSquare size={24} />
        </div>
      </main>
    </div>
  );
}
