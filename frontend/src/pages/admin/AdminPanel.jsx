import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminChallenges from './AdminChallenges';
import AdminCategories from './AdminCategories';
import AdminActivity from './AdminActivity';

const NAV = [
  { to: '/admin', label: 'OVERVIEW', exact: true },
  { to: '/admin/users', label: 'USERS' },
  { to: '/admin/challenges', label: 'CHALLENGES' },
  { to: '/admin/categories', label: 'CATEGORIES' },
  { to: '/admin/activity', label: 'ACTIVITY' },
];

export default function AdminPanel() {
  const location = useLocation();
  return (
    <div className="page" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: 200, background: '#000', borderRight: '3px solid var(--yellow)',
        padding: '20px 0', flexShrink: 0, position: 'fixed', top: 64, bottom: 0,
        overflowY: 'auto',
      }}>
        <div style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--yellow)',
          padding: '0 16px 16px', borderBottom: '2px solid rgba(255,221,0,0.3)', marginBottom: 12 }}>
          ADMIN CONSOLE
        </div>
        {NAV.map(({ to, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin';
          const isActive = exact ? location.pathname === '/admin' : location.pathname === to;
          return (
            <Link key={to} to={to} style={{
              display: 'block', padding: '10px 16px',
              fontFamily: 'var(--pixel)', fontSize: '8px',
              color: isActive ? 'var(--bg)' : 'var(--yellow)',
              background: isActive ? 'var(--yellow)' : 'transparent',
              textDecoration: 'none',
              borderLeft: isActive ? '4px solid var(--yellow)' : '4px solid transparent',
              marginBottom: 2,
            }}>
              {'>'} {label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ marginLeft: 200, flex: 1, padding: '30px 30px 60px', minWidth: 0 }}>
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="activity" element={<AdminActivity />} />
        </Routes>
      </div>
    </div>
  );
}
