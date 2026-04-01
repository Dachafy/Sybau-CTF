import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarDisplay, PRESETS } from '../utils/avatar';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get('/users/profile')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);
    try {
      await api.post('/users/avatar/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Avatar updated!');
      refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
  };

  const handlePreset = async (preset) => {
    try {
      await api.post('/users/avatar/preset', { preset });
      setMsg('Avatar updated!');
      refreshUser();
    } catch (err) {
      setError('Failed to set preset');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/users/avatar');
      setMsg('Avatar removed');
      refreshUser();
    } catch {}
  };

  const av = getAvatarDisplay(user);
  const diffColor = { easy: 'var(--primary)', medium: 'var(--yellow)', hard: 'var(--red)' };

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="glow" style={{ fontFamily: 'var(--pixel)', fontSize: '10px' }}>LOADING<span className="blink">...</span></span>
    </div>
  );

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      <div style={{ paddingTop: 30, maxWidth: 860, margin: '0 auto' }}>
        {/* Profile Header */}
        <div className="pixel-card" style={{ marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}>
              {av.type === 'img'
                ? <img src={av.src} alt="avatar" style={{ width: 80, height: 80, border: '4px solid var(--primary)', display: 'block' }} />
                : av.emoji}
            </div>
            <button className="btn btn-sm" onClick={() => fileRef.current.click()}>UPLOAD</button>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/jpg,image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '14px', color: 'var(--accent)', marginBottom: 4 }}
              className="glow-cyan">{data?.user?.username}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
              {data?.user?.email}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <StatBox label="POINTS" value={data?.user?.total_points} color="var(--yellow)" />
              <StatBox label="SOLVES" value={data?.user?.solve_count} color="var(--primary)" />
              <StatBox label="ROLE" value={data?.user?.role?.toUpperCase()} color="var(--magenta)" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-red btn-sm" onClick={() => { logout(); navigate('/'); }}>SIGN OUT</button>
            <button className="btn btn-sm" onClick={handleRemoveAvatar}>RM AVATAR</button>
          </div>
        </div>

        {msg && <div className="notif notif-success" style={{ marginBottom: 16 }}>✓ {msg}</div>}
        {error && <div className="notif notif-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '3px solid var(--primary)' }}>
          {['stats', 'history', 'avatar'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              fontFamily: 'var(--pixel)', fontSize: '8px', padding: '10px 16px',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'var(--bg)' : 'var(--primary)',
              border: 'none', cursor: 'pointer', borderRight: '1px solid var(--primary)',
            }}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'stats' && (
          <div>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '9px', color: 'var(--text-dim)', marginBottom: 16 }}>
              SOLVED CHALLENGES
            </div>
            {data?.solvedChallenges?.length === 0 && (
              <div className="pixel-card" style={{ textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                No challenges solved yet. Start hacking!
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data?.solvedChallenges?.map(ch => (
                <div key={ch.id} className="pixel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{ch.title}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginLeft: 12 }}>{ch.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`badge badge-${ch.difficulty}`}>{ch.difficulty}</span>
                    <span style={{ fontFamily: 'var(--pixel)', fontSize: '9px', color: 'var(--yellow)' }}>+{ch.points}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                      {new Date(ch.solved_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '9px', color: 'var(--text-dim)', marginBottom: 16 }}>
              SUBMISSION LOG
            </div>
            <div className="pixel-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th>CHALLENGE</th>
                    <th>FLAG</th>
                    <th>RESULT</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.submissions?.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--mono)' }}>{s.challenge_title}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.submitted_flag}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--pixel)', fontSize: '7px',
                          color: s.is_correct ? 'var(--primary)' : 'var(--red)' }}>
                          {s.is_correct ? '✓ CORRECT' : '✗ WRONG'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                        {new Date(s.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.submissions?.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                  No submissions yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'avatar' && (
          <div>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '9px', color: 'var(--text-dim)', marginBottom: 16 }}>
              SELECT AVATAR
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {Object.entries(PRESETS).map(([key, emoji]) => (
                <button key={key} onClick={() => handlePreset(key)} style={{
                  background: user?.avatar_preset === key ? 'rgba(0,255,136,0.15)' : 'var(--bg2)',
                  border: `3px solid ${user?.avatar_preset === key ? 'var(--primary)' : 'rgba(0,255,136,0.3)'}`,
                  padding: 16, cursor: 'pointer', fontSize: 32, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  {emoji}
                  <span style={{ fontFamily: 'var(--pixel)', fontSize: '6px', color: 'var(--text-dim)' }}>
                    {key}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ border: `2px solid ${color}`, padding: '8px 16px', background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ fontFamily: 'var(--pixel)', fontSize: '7px', color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--pixel)', fontSize: '12px', color, textShadow: `0 0 8px ${color}` }}>{value}</div>
    </div>
  );
}
