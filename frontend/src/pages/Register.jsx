import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  const fields = [
    { key: 'username', label: 'USERNAME', type: 'text', placeholder: 'choose a username...' },
    { key: 'email', label: 'EMAIL', type: 'email', placeholder: 'your@email.com...' },
    { key: 'password', label: 'PASSWORD', type: 'password', placeholder: 'min 6 characters...' },
    { key: 'confirmPassword', label: 'CONFIRM PASSWORD', type: 'password', placeholder: 'repeat password...' },
  ];

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 20px' }}>
        <div className="pixel-card">
          <div style={{ fontFamily: 'var(--pixel)', fontSize: '11px', color: 'var(--accent)', marginBottom: 24, textAlign: 'center' }}
            className="glow-cyan">
            ▓ CREATE ACCOUNT
          </div>

          <form onSubmit={handleSubmit}>
            {fields.map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                  {'>'} {f.label}
                </label>
                <input
                  className="pixel-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}

            {error && <div className="notif notif-error">⚠ {error}</div>}
            {success && <div className="notif notif-success">✓ {success}</div>}

            <button className="btn btn-cyan" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? '[ REGISTERING... ]' : '[ CREATE ACCOUNT ]'}
            </button>
          </form>

          <hr className="pixel-hr" />
          <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            Have account? <Link to="/login" style={{ color: 'var(--yellow)' }}>LOGIN</Link>
          </div>
        </div>
      </div>
    </div>
  );
}