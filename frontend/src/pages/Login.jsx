import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 20px' }}>
        <div className="pixel-card">
          <div style={{
            fontFamily: 'var(--pixel)', fontSize: '11px',
            color: 'var(--accent)', marginBottom: 24, textAlign: 'center'
          }} className="glow-cyan">
            ▓ USER LOGIN
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontFamily: 'var(--pixel)', fontSize: '8px',
                color: 'var(--text-dim)', display: 'block', marginBottom: 6
              }}>
                {'>'} USERNAME OR EMAIL
              </label>
              <input
                className="pixel-input"
                type="text"
                placeholder="enter username or email..."
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontFamily: 'var(--pixel)', fontSize: '8px',
                color: 'var(--text-dim)', display: 'block', marginBottom: 6
              }}>
                {'>'} PASSWORD
              </label>
              <input
                className="pixel-input"
                type="password"
                placeholder="enter password..."
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="notif notif-error">⚠ {error}</div>}

            <button
              className="btn btn-yellow"
              type="submit"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}
            </button>
          </form>

          <hr className="pixel-hr" />
          <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            No account? <Link to="/register" style={{ color: 'var(--accent)' }}>REGISTER</Link>
          </div>
        </div>
      </div>
    </div>
  );
}