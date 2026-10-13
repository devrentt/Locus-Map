import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userData.user.id)
        .single();
      setProfile(data);
    }

    loadProfile();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <button className="secondary" onClick={() => navigate(-1)} style={{ padding: '8px 16px' }}>← Back</button>
        <h2>Profile</h2>
        <div style={{ width: '80px' }}></div> {/* Spacer */}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#444', marginBottom: '16px' }}></div>
        <h3 style={{ fontSize: '20px' }}>{profile?.username || 'Guest User'}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          {profile ? profile.role : 'No ID (Not logged in)'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="secondary" style={{ textAlign: 'left', padding: '16px' }}>Connection Settings</button>
        <button className="secondary" style={{ textAlign: 'left', padding: '16px' }}>Notifications</button>
        <button className="secondary" style={{ textAlign: 'left', padding: '16px' }}>Language & Theme</button>
        {profile?.role === 'admin' && <button
          onClick={() => navigate('/editor')} 
          style={{ textAlign: 'left', padding: '16px', backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}
        >
          🛠️ Map Editor (Admin)
        </button>}
      </div>

      <button onClick={handleLogout} style={{ marginTop: 'auto', backgroundColor: '#F44336' }}>
        Log Out
      </button>
    </div>
  );
}

export default Profile;
