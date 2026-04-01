import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarDisplay } from '../../utils/avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const av = getAvatarDisplay(user);

  if (location.pathname === '/') return null;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: '#000', borderBottom: '3px solid var(--primary)',
      boxShadow: '0 0 20px rgba(0,255,136,0.3)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--pixel)', fontSize: '11px', color: 'var(--primary)' }}
            className="glow">SYBAU<span style={{color:'var(--accent)'}}>CTF</span></span>
        </Link>

        {user && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>CHALLENGES</NavLink>
            <NavLink to="/leaderboard" active={location.pathname === '/leaderboard'}>BOARD</NavLink>
            <NavLink to="/profile" active={location.pathname === '/profile'}>PROFILE</NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin" active={location.pathname.startsWith('/admin')} color="var(--yellow)">ADMIN</NavLink>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{av.type === 'img'
                ? <img src={av.src} alt="av" style={{width:28,height:28,border:'2px solid var(--primary)'}} />
                : av.emoji
              }</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{user.username}</span>
              <span style={{ fontFamily: 'var(--pixel)', fontSize: 9, color: 'var(--yellow)' }}>+{user.total_points}</span>
              <button className="btn btn-red btn-sm" onClick={handleLogout}>EXIT</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, children, active, color }) {
  return (
    <Link to={to} style={{
      fontFamily: 'var(--pixel)', fontSize: '9px',
      color: active ? 'var(--bg)' : (color || 'var(--primary)'),
      background: active ? (color || 'var(--primary)') : 'transparent',
      padding: '6px 12px',
      border: `2px solid ${color || 'var(--primary)'}`,
      textDecoration: 'none',
      transition: 'all 0.1s',
    }}>{children}</Link>
  );
}
