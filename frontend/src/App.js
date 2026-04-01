import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChallengeView from './pages/ChallengeView';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/admin/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="glow" style={{ fontFamily: 'var(--pixel)', fontSize: '12px' }}>
          LOADING<span className="blink">...</span>
        </span>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Landing — redirect if already logged in */}
        <Route
          path="/"
          element={
            !user ? <Landing /> :
            user.role === 'admin' ? <Navigate to="/admin" replace /> :
            <Navigate to="/dashboard" replace />
          }
        />

        {/* Public only */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* Private */}
        <Route path="/dashboard" element={!user ? <Navigate to="/login" replace /> : <Dashboard />} />
        <Route path="/challenge/:id" element={!user ? <Navigate to="/login" replace /> : <ChallengeView />} />
        <Route path="/leaderboard" element={!user ? <Navigate to="/login" replace /> : <Leaderboard />} />
        <Route path="/profile" element={!user ? <Navigate to="/login" replace /> : <Profile />} />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            !user ? <Navigate to="/login" replace /> :
            user.role !== 'admin' ? <Navigate to="/dashboard" replace /> :
            <AdminPanel />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}