import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title:'', icon:'🗂', color:'#00ffcc', description:'' });
  const [msg, setMsg] = useState('');

  const fetch = async () => {
    const res = await api.get(`/admin/categories${search ? `?search=${search}` : ''}`);
    setCategories(res.data.categories);
  };
  useEffect(() => { fetch(); }, [search]);

  const setNotif = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/categories', form); setNotif('Category created'); setForm({ title:'', icon:'🗂', color:'#00ffcc', description:'' }); fetch(); }
    catch (err) { setNotif(err.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try { await api.delete(`/admin/categories/${id}`); fetch(); } catch (err) { setNotif(err.response?.data?.error || 'Error'); }
  };

  return (
    <div>
      <h2 style={{ fontSize:'12px',color:'var(--yellow)',marginBottom:20 }} className="glow-yellow">▓ CATEGORY MANAGEMENT</h2>
      {msg && <div className="notif notif-info" style={{ marginBottom:16 }}>{msg}</div>}

      <div className="pixel-card" style={{ marginBottom:24,borderColor:'var(--magenta)' }}>
        <div style={{ fontFamily:'var(--pixel)',fontSize:'8px',color:'var(--magenta)',marginBottom:16 }}>▓ NEW CATEGORY</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 80px 140px',gap:12,marginBottom:12 }}>
            <div>
              <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} TITLE</label>
              <input className="pixel-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
            </div>
            <div>
              <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} ICON</label>
              <input className="pixel-input" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} maxLength={4} />
            </div>
            <div>
              <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} COLOR</label>
              <input className="pixel-input" type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} style={{ padding:4,height:42 }} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontFamily:'var(--pixel)',fontSize:'7px',color:'var(--text-dim)',display:'block',marginBottom:4 }}>{'>'} DESCRIPTION</label>
            <input className="pixel-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          </div>
          <button className="btn btn-magenta" type="submit">[ CREATE CATEGORY ]</button>
        </form>
      </div>

      <div style={{ marginBottom:16 }}>
        <input className="pixel-input" style={{ maxWidth:320 }} placeholder="Search categories..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16 }}>
        {categories.map(c => (
          <div key={c.id} className="pixel-card" style={{ borderColor: c.color, display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <div style={{ fontSize:24,marginBottom:4 }}>{c.icon}</div>
              <div style={{ fontFamily:'var(--pixel)',fontSize:'9px',color:c.color }}>{c.title}</div>
              <div style={{ fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',marginTop:4 }}>{c.description}</div>
            </div>
            <button className="btn btn-sm btn-red" onClick={() => del(c.id)}>DEL</button>
          </div>
        ))}
      </div>
    </div>
  );
}
