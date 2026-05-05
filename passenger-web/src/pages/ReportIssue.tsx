import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { reportIncident } from '../api';
import { Plane, MapPin, Send, MessageSquare, AlertCircle, Phone, Mail } from 'lucide-react';

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
    const incNumber = success.incident?.result?.number || 'INC-PENDING';
    const triage = success.ai_triage;
    
    return (
      <div className="mobile-container animate-fade-up" style={{ justifyContent: 'center', padding: 24 }}>
        <div className="glass-panel" style={{ padding: 32, borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-full)',
            background: 'var(--color-success)', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Plane color="white" size={40} />
          </div>
          <h2 className="brand-text" style={{ fontSize: '1.75rem', marginBottom: 8, color: '#0EA5E9' }}>Issue Reported</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '1.1rem' }}>
            Thank you! Staff have been notified.
          </p>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Incident Number</p>
            <p className="brand-text" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{incNumber}</p>
          </div>

          {triage && (
             <div style={{ background: 'var(--color-bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: 24 }}>
                 <p style={{ color: '#0EA5E9', fontWeight: 600, marginBottom: 8 }}>⚡ AeroBot Analysis</p>
                 <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Priority: {triage.priority}</p>
                 <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Est. Fix Time: {triage.estimated_fix_mins} mins</p>
             </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            {success.notifications?.email_sent && (
               <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>✓ Email confirmation sent</span>
            )}
            {success.notifications?.whatsapp_sent && (
               <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>✓ WhatsApp updates active</span>
            )}
          </div>
          
          <button className="glass-button" style={{ marginTop: 24 }} onClick={() => { setSuccess(null); setDesc(''); }}>
            Report Another Issue
          </button>
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
