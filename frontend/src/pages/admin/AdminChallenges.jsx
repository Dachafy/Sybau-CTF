import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const BLANK = { title:'', description:'', category_id:'', difficulty:'easy', points:'100', flag:'', hint:'' };

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    const [ch, cat] = await Promise.all([
      api.get('/admin/challenges'),
      api.get('/categories'),   // NOT '/api/categories'
    ]);
    setChallenges(ch.data.challenges);
    setCategories(cat.data.categories);
  };
  useEffect(() => { fetch(); }, []);

  const setNotif = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k,v));
    if (file) fd.append('attachment', file);
    try {
      if (editId) { await api.put(`/admin/challenges/${editId}`, fd); setNotif('Challenge updated'); }
      else { await api.post('/admin/challenges', fd); setNotif('Challenge created'); }
      setForm(BLANK); setFile(null); setEditId(null); setShowForm(false); fetch();
    } catch (err) { setNotif(err.response?.data?.error || 'Error'); }
  };

  const startEdit = (ch) => {
    setForm({ title: ch.title, description: ch.description, category_id: ch.category_id, difficulty: ch.difficulty,
      points: ch.points, flag: ch.flag || '', hint: ch.hint || '' });
    setEditId(ch.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteChallenge = async (id) => {
    if (!window.confirm('Delete challenge?')) return;
    try { await api.delete(`/admin/challenges/${id}`); fetch(); } catch {}
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '12px', color: 'var(--yellow)' }} className="glow-yellow">▓ CHALLENGE MANAGEMENT</h2>
        <button className="btn btn-yellow btn-sm" onClick={() => { setForm(BLANK); setEditId(null); setShowForm(!showForm); }}>
          {showForm ? '[ CANCEL ]' : '[ + NEW ]'}
        </button>
      </div>

      {msg && <div className="notif notif-info" style={{ marginBottom: 16 }}>{msg}</div>}

      {showForm && (
        <div className="pixel-card" style={{ marginBottom: 24, borderColor: 'var(--yellow)' }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--yellow)', marginBottom: 16 }}>
            {editId ? '▓ EDIT CHALLENGE' : '▓ NEW CHALLENGE'}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['title','TITLE','text'],['flag','FLAG','text'],['points','POINTS','number']].map(([k,l,t]) => (
                <div key={k}>
                  <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} {l}</label>
                  <input className="pixel-input" type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required={k!=='hint'} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} CATEGORY</label>
                <select className="pixel-input" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} required>
                  <option value="">Select...</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} DIFFICULTY</label>
                <select className="pixel-input" value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>
                  <option value="easy">EASY</option>
                  <option value="medium">MEDIUM</option>
                  <option value="hard">HARD</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} DESCRIPTION</label>
              <textarea className="pixel-input" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required style={{resize:'vertical'}} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} HINT (optional)</label>
              <input className="pixel-input" type="text" value={form.hint} onChange={e=>setForm({...form,hint:e.target.value})} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} ATTACHMENT (optional)</label>
              <input type="file" onChange={e=>setFile(e.target.files[0])} style={{ fontFamily:'var(--mono)',color:'var(--text)',fontSize:12 }} />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button className="btn btn-yellow" type="submit">{editId ? '[ UPDATE ]' : '[ CREATE ]'}</button>
              <button className="btn btn-sm" type="button" onClick={() => { setShowForm(false); setEditId(null); }}>[ CANCEL ]</button>
            </div>
          </form>
        </div>
      )}

      <div className="pixel-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="pixel-table">
          <thead><tr><th>ID</th><th>TITLE</th><th>CATEGORY</th><th>DIFF</th><th>PTS</th><th>SOLVES</th><th>ACTIVE</th><th>ACTIONS</th></tr></thead>
          <tbody>
            {challenges.map(ch => (
              <tr key={ch.id}>
                <td style={{ color:'var(--text-dim)',fontSize:11 }}>#{ch.id}</td>
                <td style={{ fontFamily:'var(--mono)' }}>{ch.title}</td>
                <td style={{ fontSize:11,color:'var(--text-dim)' }}>{ch.category_name}</td>
                <td><span className={`badge badge-${ch.difficulty}`}>{ch.difficulty}</span></td>
                <td style={{ color:'var(--yellow)',fontFamily:'var(--pixel)',fontSize:'9px' }}>{ch.points}</td>
                <td style={{ textAlign:'center' }}>{ch.solve_count}</td>
                <td><span style={{ color: ch.is_active ? 'var(--primary)' : 'var(--red)', fontFamily:'var(--pixel)',fontSize:'7px' }}>
                  {ch.is_active ? 'ON' : 'OFF'}</span></td>
                <td>
                  <div style={{ display:'flex',gap:6 }}>
                    <button className="btn btn-sm btn-yellow" onClick={() => startEdit(ch)}>EDIT</button>
                    <button className="btn btn-sm btn-red" onClick={() => deleteChallenge(ch.id)}>DEL</button>
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
