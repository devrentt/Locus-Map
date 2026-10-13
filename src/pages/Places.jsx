import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hospitals from '../data/hospitals.json';

function Places() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredHospitals = Object.values(hospitals).filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Hospitals</h1>
        <button className="secondary" onClick={() => navigate('/profile')} style={{ padding: '8px 16px' }}>Profile</button>
      </div>

      <input 
        type="text" 
        placeholder="Search hospital..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '20px' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredHospitals.map(hospital => (
          <div 
            key={hospital.id} 
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--border-radius-card)',
              padding: '16px',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/venue/${hospital.id}`)}
          >
            <h3 style={{ marginBottom: '8px' }}>{hospital.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
              {hospital.city} • ★ {hospital.rating} ({hospital.reviews})
            </p>
            {hospital.active && (
              <span style={{ 
                backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                color: 'var(--accent)', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                Map is active
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Places;
