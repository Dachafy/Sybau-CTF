import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DIFF_COLORS = { easy: 'var(--primary)', medium: 'var(--yellow)', hard: 'var(--red)' };

export default function Dashboard() {
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', difficulty: '' });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories));
    fetchChallenges();
  }, []);

  useEffect(() => { fetchChallenges(); }, [filters]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      const res = await api.get(`/challenges?${params}`);
      setChallenges(res.data.challenges);
    } catch {} finally { setLoading(false); }
  };

  // Group by category
  const grouped = challenges.reduce((acc, ch) => {
    const cat = ch.category;
    if (!acc[cat]) acc[cat] = { color: ch.category_color, icon: ch.category_icon, challenges: [] };
    acc[cat].challenges.push(ch);
    return acc;
  }, {});

  const solved = challenges.filter(c => c.is_solved).length;

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ paddingTop: 30, marginBottom: 30 }}>
        <div style={{ fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: 8 }}>
          MISSION CONTROL
        </div>
        <h1 style={{ fontSize: '16px', color: 'var(--primary)' }} className="glow">
          CHALLENGE BOARD
        </h1>
        <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', marginTop: 8 }}>
          {solved}/{challenges.length} missions completed &nbsp;|&nbsp;
          <span style={{ color: 'var(--yellow)' }}>{user?.total_points} pts</span>
        </div>
      </div>

      {/* Filters */}
      <div className="pixel-card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--text-dim)' }}>FILTER:</span>

        <select className="pixel-input" style={{ width: 'auto', padding: '6px 12px' }}
          value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
          <option value="">ALL CATEGORIES</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
        </select>

        <select className="pixel-input" style={{ width: 'auto', padding: '6px 12px' }}
          value={filters.difficulty} onChange={e => setFilters({...filters, difficulty: e.target.value})}>
          <option value="">ALL DIFFICULTIES</option>
          <option value="easy">EASY</option>
          <option value="medium">MEDIUM</option>
          <option value="hard">HARD</option>
        </select>

        <button className="btn btn-sm" onClick={() => setFilters({ category: '', difficulty: '' })}>
          RESET
        </button>
      </div>

      {/* Challenges */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--text-dim)' }}>
          LOADING MISSIONS<span className="blink">...</span>
        </div>
      ) : (
        Object.entries(grouped).map(([catName, catData]) => (
          <div key={catName} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{catData.icon}</span>
              <h2 style={{ fontSize: '12px', color: catData.color,
                textShadow: `0 0 8px ${catData.color}` }}>
                {catName}
              </h2>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                [{catData.challenges.filter(c=>c.is_solved).length}/{catData.challenges.length}]
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {catData.challenges.map(ch => (
                <ChallengeCard key={ch.id} challenge={ch} onClick={() => navigate(`/challenge/${ch.id}`)} />
              ))}
            </div>
          </div>
        ))
      )}

      {!loading && challenges.length === 0 && (
        <div className="pixel-card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--text-dim)' }}>
            NO MISSIONS FOUND
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge: ch, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: ch.is_solved ? 'rgba(0,255,136,0.05)' : 'var(--bg2)',
      border: `3px solid ${ch.is_solved ? 'var(--primary)' : 'rgba(0,255,136,0.3)'}`,
      padding: 16, cursor: 'pointer', position: 'relative',
      transition: 'border-color 0.1s, box-shadow 0.1s',
      boxShadow: ch.is_solved ? '0 0 12px rgba(0,255,136,0.2)' : 'none',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = ch.category_color}
      onMouseLeave={e => e.currentTarget.style.borderColor = ch.is_solved ? 'var(--primary)' : 'rgba(0,255,136,0.3)'}
    >
      {ch.is_solved && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontFamily: 'var(--pixel)', fontSize: '7px',
          color: 'var(--primary)', background: 'rgba(0,255,136,0.15)',
          border: '2px solid var(--primary)', padding: '2px 6px',
        }}>✓ SOLVED</div>
      )}
      <div style={{ fontFamily: 'var(--pixel)', fontSize: '9px', color: 'var(--accent)', marginBottom: 8 }}>
        {ch.title}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 12,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ch.description}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className={`badge badge-${ch.difficulty}`}>{ch.difficulty.toUpperCase()}</span>
        <span style={{ fontFamily: 'var(--pixel)', fontSize: '9px', color: 'var(--yellow)', marginLeft: 'auto' }}>
          {ch.points} PTS
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          {ch.solve_count} solves
        </span>
      </div>
    </div>
  );
}
