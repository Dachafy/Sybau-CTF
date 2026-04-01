import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data));
  }, []);

  const boxes = stats ? [
    { label: 'USERS', value: stats.total_users, color: 'var(--cyan)' },
    { label: 'CHALLENGES', value: stats.total_challenges, color: 'var(--primary)' },
    { label: 'CATEGORIES', value: stats.total_categories, color: 'var(--magenta)' },
    { label: 'SOLVES', value: stats.total_solves, color: 'var(--yellow)' },
    { label: 'SUBMISSIONS', value: stats.total_submissions, color: 'var(--accent)' },
  ] : [];

  return (
    <div>
      <h2 style={{ fontSize: '12px', color: 'var(--yellow)', marginBottom: 24 }}
        className="glow-yellow">▓ SYSTEM OVERVIEW</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {boxes.map(b => (
          <div key={b.label} className="pixel-card" style={{ borderColor: b.color, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '20px', color: b.color,
              textShadow: `0 0 10px ${b.color}`, marginBottom: 8 }}>{b.value}</div>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '7px', color: 'var(--text-dim)' }}>{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
