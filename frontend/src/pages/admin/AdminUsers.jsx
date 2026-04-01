import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const fetchUsers = async () => {
    const res = await api.get(`/admin/users${search ? `?search=${search}` : ''}`);
    setUsers(res.data.users);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const action = async (fn) => {
    try { await fn(); setMsg('Done'); fetchUsers(); }
    catch (err) { setMsg(err.response?.data?.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <h2 style={{ fontSize: '12px', color: 'var(--yellow)', marginBottom: 20 }} className="glow-yellow">▓ USER MANAGEMENT</h2>
      {msg && <div className="notif notif-info" style={{ marginBottom: 16 }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="pixel-input" style={{ maxWidth: 320 }} placeholder="Search username or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="pixel-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="pixel-table">
          <thead>
            <tr>
              <th>ID</th><th>USER</th><th>EMAIL</th><th>POINTS</th><th>SOLVES</th><th>ROLE</th><th>STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>#{u.id}</td>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 'bold' }}>{u.username}</td>
                <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.email}</td>
                <td style={{ color: 'var(--yellow)', fontFamily: 'var(--pixel)', fontSize: '9px' }}>{u.total_points}</td>
                <td style={{ textAlign: 'center' }}>{u.solve_count}</td>
                <td><span style={{ fontFamily: 'var(--pixel)', fontSize: '7px',
                  color: u.role === 'admin' ? 'var(--yellow)' : 'var(--text-dim)' }}>{u.role}</span></td>
                <td><span style={{ fontFamily: 'var(--pixel)', fontSize: '7px',
                  color: u.is_banned ? 'var(--red)' : 'var(--primary)' }}>
                  {u.is_banned ? 'BANNED' : 'ACTIVE'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-yellow" onClick={() => action(() => api.patch(`/admin/users/${u.id}/ban`))}>
                      {u.is_banned ? 'UNBAN' : 'BAN'}
                    </button>
                    <button className="btn btn-sm" onClick={() => { if(window.confirm('Reset progress?')) action(() => api.post(`/admin/users/${u.id}/reset`)); }}>
                      RESET
                    </button>
                    <button className="btn btn-sm btn-red" onClick={() => { if(window.confirm('Delete user?')) action(() => api.delete(`/admin/users/${u.id}`)); }}>
                      DEL
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
