import React, { useState, useEffect } from 'react';

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500); // Show for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`loader-overlay ${!isVisible ? 'loader-exit' : ''}`}>
      <div className="loader-parallax-bg"></div>
      
      <div className="loader-content">
        <div className="loader-logo">ESTIMATION PRO</div>
        <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.1em' }}>
          INITIALIZING DASHBOARD
        </div>
        
        <div className="loader-bar-container">
          <div className="loader-bar"></div>
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>✓</span> SUPABASE CONNECTED
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>✓</span> ASSETS OPTIMIZED
          </div>
        </div>
      </div>
      
      <div style={{ position: 'absolute', bottom: '2rem', fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.5 }}>
        PREMIUM DESIGN SYSTEM v1.2.0
      </div>
    </div>
  );
};

export default LoadingScreen;
