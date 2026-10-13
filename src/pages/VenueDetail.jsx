import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hospitals from '../data/hospitals.json';

function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const venue = hospitals[id];

  if (!venue) {
    return <div className="page"><h2>Venue not found</h2></div>;
  }

  return (
    <div className="page">
      {/* Back button — slide in from left */}
      <button
        className="secondary"
        onClick={() => navigate(-1)}
        style={{
          alignSelf: 'flex-start',
          marginBottom: '20px',
          animation: 'slideInLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        ← Back
      </button>

      {/* Image placeholder — fade in */}
      <div style={{
        height: '400px',
        width: '600px',
        backgroundColor: '#333',
        borderRadius: 'var(--border-radius-card)',
        marginBottom: '90px',
        animation: 'fadeIn 0.5s 0.1s both',
        overflow: 'hidden',
      }}>
        {venue.locImageUrl && (
          <img
            src={venue.locImageUrl}
            alt={venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Info — slide up with stagger */}
      <h1 style={{ animation: 'fadeInUp 0.5s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
        {venue.name}
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: '20px',
        animation: 'fadeInUp 0.5s 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        {venue.city} • ★ {venue.rating} ({venue.reviews})
      </p>

      <p style={{
        lineHeight: '1.6',
        marginBottom: '40px',
        animation: 'fadeInUp 0.5s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        {venue.desc}
      </p>

      {/* CTA button — scale pop */}
      {venue.active && (
        <button
          onClick={() => navigate(`/venue/${id}/map`)}
          style={{
            marginTop: 'auto',
            animation: 'slideInUp 0.5s 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          Open Indoor Map
        </button>
      )}
    </div>
  );
}

export default VenueDetail;