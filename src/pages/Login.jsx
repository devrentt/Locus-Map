import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        padding: '40px 32px',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        margin: '0 16px',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'var(--accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '16px',
            animation: 'scalePop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}>
            📍
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Welcome to Locus</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Username" required />
          <input type="password" placeholder="Password" required />
          <button type="submit" style={{ marginTop: '8px' }}>Log In</button>
        </form>

        <div style={{ margin: '16px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          or
        </div>

        <button
          className="secondary"
          onClick={() => navigate('/search')}
          style={{ width: '100%' }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

export default Login;
