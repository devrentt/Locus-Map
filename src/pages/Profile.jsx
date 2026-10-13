import React from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <button className="secondary" onClick={() => navigate(-1)} style={{ padding: '8px 16px' }}>← Back</button>
        <h2>Profile</h2>
        <div style={{ width: '80px' }}></div> {/* Spacer */}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#444', marginBottom: '16px' }}></div>
        <h3 style={{ fontSize: '20px' }}>Guest User</h3>
        <p style={{ color: 'var(--text-secondary)' }}>No ID (Not logged in)</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="secondary" style={{ textAlign: 'left', padding: '16px' }}>Connection Settings</button>
        <button className="secondary" style={{ textAlign: 'left', padding: '16px' }}>Notifications</button>
        <button className="secondary" style={{ textAlign: 'left', padding: '16px' }}>Language & Theme</button>
        <button 
          onClick={() => navigate('/editor')} 
          style={{ textAlign: 'left', padding: '16px', backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}
        >
          🛠️ Map Editor (Admin)
        </button>
      </div>

      <button onClick={() => navigate('/login')} style={{ marginTop: 'auto', backgroundColor: '#F44336' }}>
        Log Out
      </button>
    </div>
  );
}

export default Profile;
