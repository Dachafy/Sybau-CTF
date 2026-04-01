import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/activity').then(r => setActivity(r.data.activity)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <h2 style={{ fontSize:'12px',color:'var(--yellow)' }} className="glow-yellow">▓ ACTIVITY MONITOR</h2>
        <button className="btn btn-sm btn-yellow" onClick={() => api.get('/admin/activity').then(r => setActivity(r.data.activity))}>
          REFRESH
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center',padding:60,fontFamily:'var(--pixel)',fontSize:'10px',color:'var(--text-dim)' }}>
          LOADING<span className="blink">...</span>
        </div>
      ) : (
        <div className="pixel-card" style={{ padding:0,overflow:'auto' }}>
          <table className="pixel-table">
            <thead><tr><th>TIME</th><th>USER</th><th>CHALLENGE</th><th>FLAG</th><th>RESULT</th></tr></thead>
            <tbody>
              {activity.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',whiteSpace:'nowrap' }}>
                    {new Date(a.submitted_at).toLocaleString()}
                  </td>
                  <td style={{ fontFamily:'var(--mono)' }}>{a.username}</td>
                  <td style={{ fontFamily:'var(--mono)',fontSize:12 }}>{a.challenge_title}</td>
                  <td style={{ fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {a.submitted_flag}
                  </td>
                  <td>
                    <span style={{ fontFamily:'var(--pixel)',fontSize:'7px',
                      color: a.is_correct ? 'var(--primary)' : 'var(--red)' }}>
                      {a.is_correct ? '✓ CORRECT' : '✗ WRONG'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activity.length === 0 && (
            <div style={{ padding:40,textAlign:'center',fontFamily:'var(--mono)',color:'var(--text-dim)' }}>No activity yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
