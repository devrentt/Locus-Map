import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import hospitals from '../data/hospitals.json';

// Fix Leaflet default marker icons for Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FlyToLocation({ lat, lng }) {
  const map = useMap();
  React.useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

const venueList = Object.values(hospitals);
const DEFAULT_CENTER = [-2.5, 118.0];
const DEFAULT_ZOOM = 5;

function SearchMap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const filtered = venueList.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (venue) => {
    setSearch(venue.name);
    setSelectedVenue(venue);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) setSelectedVenue(null);
  };

  return (
    <div className="page-fullscreen">

      {/* ── Full-screen Map ── */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {selectedVenue && <FlyToLocation lat={selectedVenue.lat} lng={selectedVenue.lng} />}
        {venueList.map(venue => (
          <Marker
            key={venue.id}
            position={[venue.lat, venue.lng]}
            eventHandlers={{ click: () => handleSelect(venue) }}
          >
            <Popup>
              <strong>{venue.name}</strong><br />
              {venue.city} • ★ {venue.rating}<br />
              <button
                onClick={() => navigate(`/venue/${venue.id}`)}
                style={{
                  marginTop: '8px', padding: '6px 12px',
                  background: '#4a90e2', color: '#fff',
                  border: 'none', borderRadius: '6px',
                  cursor: 'pointer', width: '100%',
                }}
              >
                Lihat Detail
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── TOP-RIGHT: Account icon (Google Maps style) ── */}
      <div style={{
        position: 'absolute',
        top: 'max(16px, env(safe-area-inset-top, 16px))',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        animation: 'fadeIn 0.4s ease both',
      }}>
        {/* Account button */}
        <button
          onClick={() => navigate('/profile')}
          title="Profile"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#4a90e2',
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            padding: 0,
          }}
        >
          👤
        </button>

        {/* Zoom controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          {['+', '−'].map((label, i) => (
            <button
              key={label}
              onClick={() => {
                const mapEl = document.querySelector('.leaflet-container')?._leaflet_map;
                if (mapEl) i === 0 ? mapEl.zoomIn() : mapEl.zoomOut();
              }}
              style={{
                width: '44px',
                height: '44px',
                background: 'rgba(20, 24, 35, 0.92)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                color: '#fff',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CENTER: Search bar (Google Maps style) ── */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '16px',
        right: '16px',
        marginLeft: 'auto',
        marginRight: 'auto',
        zIndex: 1000,
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'slideInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>

        {/* Selected venue detail card — shown above search bar */}
        {selectedVenue && (
          <div style={{
            background: 'rgba(18, 22, 34, 0.96)',
            backdropFilter: 'blur(16px)',
            borderRadius: '18px',
            padding: '16px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            color: '#fff',
            animation: 'slideInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{selectedVenue.name}</div>
            <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '14px' }}>
              {selectedVenue.city} • ★ {selectedVenue.rating} ({selectedVenue.reviews})
            </div>
            <button
              onClick={() => navigate(`/venue/${selectedVenue.id}`)}
              style={{
                width: '100%', padding: '13px',
                background: '#4a90e2', border: 'none',
                borderRadius: '13px', color: '#fff',
                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}
            >
              Lihat Detail & Indoor Map →
            </button>
          </div>
        )}

        {/* Dropdown search results — shown above search bar */}
        {showDropdown && search.length > 0 && (
          <div style={{
            background: 'rgba(18, 22, 34, 0.96)',
            backdropFilter: 'blur(16px)',
            borderRadius: '18px',
            padding: '10px 8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {filtered.length === 0 && (
              <p style={{ color: '#666', fontSize: '13px', padding: '8px 12px', margin: 0 }}>Tidak ada hasil.</p>
            )}
            {filtered.map(venue => (
              <div
                key={venue.id}
                onClick={() => handleSelect(venue)}
                style={{
                  padding: '11px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: selectedVenue?.id === venue.id ? 'rgba(74,144,226,0.2)' : 'transparent',
                  color: '#fff',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background =
                  selectedVenue?.id === venue.id ? 'rgba(74,144,226,0.2)' : 'transparent'}
              >
                <div style={{ fontWeight: 600, fontSize: '14px' }}>🏥 {venue.name}</div>
                <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{venue.city} • ★ {venue.rating}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search bar itself */}
        <div style={{
          background: 'rgba(18, 22, 34, 0.96)',
          backdropFilter: 'blur(16px)',
          borderRadius: '18px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Locus logo dot */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#4a90e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            flexShrink: 0,
          }}>
            📍
          </div>

          <input
            type="text"
            placeholder="Cari lokasi rumah sakit..."
            value={search}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '15px',
              padding: 0,
            }}
          />

          {search ? (
            <button
              onClick={() => { setSearch(''); setSelectedVenue(null); setShowDropdown(false); }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                color: '#aaa',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          ) : (
            /* Quick chips saat kosong */
            <div style={{ display: 'flex', gap: '6px', flexShrink: 1, flexWrap: 'wrap', overflow: 'hidden', minWidth: 0 }}>
              {venueList.slice(0, 2).map(v => (
                <button
                  key={v.id}
                  onClick={() => handleSelect(v)}
                  style={{
                    background: 'rgba(74,144,226,0.15)',
                    border: '1px solid rgba(74,144,226,0.3)',
                    borderRadius: '20px',
                    color: '#7fb3f0',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {v.name.split(' ')[0]}…
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchMap;
