import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase belum dikonfigurasi. Isi file .env terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (signUpError) throw signUpError;

        setMessage('Akun berhasil dibuat. Silakan login.');
        setIsRegistering(false);
        setPassword('');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profileError) throw profileError;

        navigate('/search');
      }
    } catch (submitError) {
      setError(submitError.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '40px 32px', background: 'var(--bg-card)', borderRadius: '24px', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', margin: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>
            📍
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            {isRegistering ? 'Create your account' : 'Welcome to Locus'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isRegistering ? 'Register to get started' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegistering && (
            <input type="text" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          {error && <p style={{ color: '#F44336', fontSize: '13px' }}>{error}</p>}
          {message && <p style={{ color: '#4CAF50', fontSize: '13px' }}>{message}</p>}
          <button type="submit" style={{ marginTop: '8px' }}>
            {isLoading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <button className="secondary" onClick={() => { setIsRegistering(!isRegistering); setError(''); setMessage(''); }} style={{ width: '100%', marginTop: '16px' }}>
          {isRegistering ? 'Already have an account? Log In' : 'Create a new account'}
        </button>

        <div style={{ margin: '16px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>or</div>
        <button className="secondary" onClick={() => navigate('/search')} style={{ width: '100%' }}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

export default Login;
