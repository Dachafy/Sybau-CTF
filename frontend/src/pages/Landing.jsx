import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BOOT_LINES = [
  ['SYBAU-CTF v1.0.0 BOOT...', false],
  ['INITIALIZING KERNEL.......... OK', false],
  ['LOADING CHALLENGE DATABASE... OK', false],
  ['CONNECTING TO C2 SERVER...... OK', false],
  ['BYPASSING FIREWALL........... OK', false],
  ['> SYSTEM READY', true],
];

export default function Landing() {
  const navigate = useNavigate();
  const [lineCount, setLineCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineCount(prev => {
        const next = prev + 1;
        if (next >= BOOT_LINES.length) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 400);
        }
        return next;
      });
    }, 350);
    return () => clearInterval(interval);
  }, []);

  const visibleLines = BOOT_LINES.slice(0, lineCount);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '40px 20px',
    }}>
      {/* Pixel grid background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, width: '100%' }}>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--pixel)',
            fontSize: 'clamp(18px, 5vw, 36px)',
            color: 'var(--primary)',
            marginBottom: 8,
            textShadow: '0 0 20px var(--primary), 0 0 40px var(--primary)',
            letterSpacing: '4px',
          }}>
            SYBAU
          </div>
          <div style={{
            fontFamily: 'var(--pixel)',
            fontSize: 'clamp(12px, 3vw, 22px)',
            color: 'var(--accent)',
            textShadow: '0 0 20px var(--accent)',
            letterSpacing: '8px',
          }}>
            C T F
          </div>
          <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: 13, marginTop: 12 }}>
            CAPTURE THE FLAG PLATFORM
          </div>
        </div>

        {/* Boot terminal */}
        <div className="pixel-card" style={{ textAlign: 'left', marginBottom: 40, minHeight: 160 }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--accent)', marginBottom: 12 }}>
            ▓ TERMINAL OUTPUT
          </div>

          {visibleLines.map((entry, i) => {
            const text = entry[0];
            const isPrompt = entry[1];
            return (
              <div key={i} style={{
                fontFamily: 'var(--vt)',
                fontSize: '18px',
                color: isPrompt ? 'var(--accent)' : 'var(--primary)',
                marginBottom: 2,
              }}>
                {text}
              </div>
            );
          })}

          {!done && (
            <span className="blink" style={{ color: 'var(--primary)', fontFamily: 'var(--vt)', fontSize: 18 }}>
              █
            </span>
          )}
        </div>

        {/* Buttons */}
        {done && (
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-lg" onClick={() => window.location.reload()}>
              [ HOME ]
            </button>
            <button className="btn btn-cyan btn-lg" onClick={() => navigate('/register')}>
              [ REGISTER ]
            </button>
            <button className="btn btn-yellow btn-lg" onClick={() => navigate('/login')}>
              [ LOGIN ]
            </button>
          </div>
        )}

        <div style={{ marginTop: 50, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          ⚠ UNAUTHORIZED ACCESS IS A CRIME — ONLY PLAY ON SYSTEMS YOU OWN ⚠
        </div>
      </div>
    </div>
  );
}