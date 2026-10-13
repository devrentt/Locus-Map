import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="page"
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        background: 'var(--bg-color)',
      }}
    >
      {/* Animated logo icon */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '20px',
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
        marginBottom: '24px',
        animation: 'scalePop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        📍
      </div>

      {/* Title */}
      <h1 style={{
        color: 'var(--accent)',
        fontSize: '48px',
        marginBottom: '10px',
        animation: 'fadeInUp 0.6s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        Locus
      </h1>

      {/* Subtitle */}
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '16px',
        animation: 'fadeInUp 0.6s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        Find Your Way, Never Get Lost Again
      </p>

      {/* Pulse loading dots */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '48px',
        animation: 'fadeIn 0.4s 0.8s both',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: `pulseDot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default Splash;
