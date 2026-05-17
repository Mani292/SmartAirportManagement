import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatWithPassenger } from '../api';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';

interface Message { id: string; role: 'user' | 'ai'; text: string; time: string; }

const QUICK_PROMPTS = [
  "Restroom near Gate B is flooded",
  "Elevator at Terminal 2 isn't working",
  "Air conditioning not working",
];

export default function ChatBot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'ai',
      text: "Hi! I'm AeroBot 🤖\n\nI can help you report any airport facility issue quickly. Tell me what's wrong and where, and I'll handle the rest!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const history = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string = input.trim()) => {
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(m => [...m, { id: Date.now().toString(), role: 'user', text, time }]);
    history.current.push({ role: 'user', content: text });
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithPassenger(text, history.current);
      const aiText = res.data?.response || res.data?.reply || "I couldn't process that.";
      history.current.push({ role: 'assistant', content: aiText });
      setMessages(m => [...m, { id: Date.now().toString() + '1', role: 'ai', text: aiText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err) {
      setMessages(m => [...m, { id: Date.now().toString(), role: 'ai', text: "Connection error.", time }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container animate-fade-up" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)' }} title="Go Back" aria-label="Go Back">
          <ArrowLeft size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles color="var(--color-primary)" size={20} />
          </div>
          <div>
            <h1 className="brand-text" style={{ fontSize: '1.25rem' }}>AeroBot</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--color-success)' }} /> Online
            </p>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {QUICK_PROMPTS.map(q => (
            <div key={q} onClick={() => send(q)} style={{
              background: 'var(--color-bg-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem', color: 'var(--color-text-secondary)', cursor: 'pointer', border: '1px solid var(--color-border)'
            }}>
              {q}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 12, alignItems: 'flex-end' }}>
              {m.role === 'ai' && (
                <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={14} color="var(--color-primary)" />
                </div>
              )}
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 'var(--radius-lg)',
                background: m.role === 'user' ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' : 'var(--color-bg-card)',
                color: m.role === 'user' ? 'white' : 'var(--color-text-primary)',
                border: m.role === 'ai' ? '1px solid var(--color-border)' : 'none',
                borderBottomRightRadius: m.role === 'user' ? 4 : 'var(--radius-lg)',
                borderBottomLeftRadius: m.role === 'ai' ? 4 : 'var(--radius-lg)'
              }}>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                <p style={{ fontSize: '0.7rem', color: m.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', marginTop: 4, textAlign: 'right' }}>{m.time}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="var(--color-primary)" />
              </div>
              <div style={{ background: 'var(--color-bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', borderBottomLeftRadius: 4 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Thinking...</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer style={{ padding: 16, background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
        <input
          type="text" className="glass-input" style={{ flex: 1 }}
          placeholder="Describe the issue..."
          value={input} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && send()}
        />
        <button
          onClick={() => send()} disabled={!input.trim() || loading}
          style={{
            width: 50, height: 50, borderRadius: 25, background: 'var(--color-primary)',
            border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!input.trim() || loading) ? 0.5 : 1, cursor: 'pointer'
          }}
          title="Send Message"
          aria-label="Send Message"
        >
          <Send size={20} style={{ marginLeft: -2 }} />
        </button>
      </footer>
    </div>
  );
}
