import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarDisplay } from '../utils/avatar';

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/leaderboard')
      .then(r => setBoard(r.data.leaderboard))
      .finally(() => setLoading(false));
  }, []);

  const rankColor = (i) => {
    if (i === 0) return 'var(--yellow)';
    if (i === 1) return '#aaaaaa';
    if (i === 2) return '#cd7f32';
    return 'var(--text-dim)';
  };

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      <div style={{ paddingTop: 30, marginBottom: 30 }}>
        <div style={{ fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: 8 }}>
          ARCADE MODE
        </div>
        <h1 style={{ fontSize: '16px' }} className="glow">HIGH SCORES</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--text-dim)' }}>
          FETCHING SCORES<span className="blink">...</span>
        </div>
      ) : (
        <div className="pixel-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 50px 1fr 120px 80px 120px',
            padding: '12px 16px',
            background: 'rgba(0,255,136,0.08)',
            borderBottom: '3px solid var(--primary)',
            fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--accent)',
            gap: 8,
          }}>
            <span>RANK</span>
            <span>PFP</span>
            <span>PLAYER</span>
            <span style={{ textAlign: 'right' }}>POINTS</span>
            <span style={{ textAlign: 'center' }}>SOLVES</span>
            <span style={{ textAlign: 'right' }}>LAST SOLVE</span>
          </div>

          {board.map((entry, i) => {
            const av = getAvatarDisplay(entry);
            const isMe = entry.id === user?.id;
            return (
              <div key={entry.id} style={{
                display: 'grid', gridTemplateColumns: '60px 50px 1fr 120px 80px 120px',
                padding: '12px 16px', gap: 8, alignItems: 'center',
                borderBottom: '1px solid rgba(0,255,136,0.1)',
                background: isMe ? 'rgba(0,255,136,0.07)' : 'transparent',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = isMe ? 'rgba(0,255,136,0.07)' : 'transparent'}
              >
                {/* Rank */}
                <div style={{ fontFamily: 'var(--pixel)', fontSize: i < 3 ? '11px' : '9px',
                  color: rankColor(i), textShadow: i < 3 ? `0 0 8px ${rankColor(i)}` : 'none' }}>
                  #{i + 1}
                </div>
                {/* Avatar */}
                <div style={{ fontSize: 22 }}>
                  {av.type === 'img'
                    ? <img src={av.src} alt="av" style={{ width: 32, height: 32, border: '2px solid var(--primary)' }} />
                    : av.emoji}
                </div>
                {/* Username */}
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13,
                  color: isMe ? 'var(--accent)' : 'var(--text)' }}>
                  {isMe ? '▶ ' : ''}{entry.username}
                </div>
                {/* Points */}
                <div style={{ fontFamily: 'var(--pixel)', fontSize: '10px',
                  color: 'var(--yellow)', textAlign: 'right',
                  textShadow: i < 3 ? '0 0 8px var(--yellow)' : 'none' }}>
                  {entry.total_points} PTS
                </div>
                {/* Solves */}
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12,
                  color: 'var(--text-dim)', textAlign: 'center' }}>
                  {entry.solve_count}
                </div>
                {/* Last solve */}
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10,
                  color: 'var(--text-dim)', textAlign: 'right' }}>
                  {entry.last_solve_time
                    ? new Date(entry.last_solve_time).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            );
          })}

          {board.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--text-dim)' }}>
              NO SCORES YET — BE THE FIRST!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
