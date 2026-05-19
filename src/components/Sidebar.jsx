import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeView, setActiveView }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'home', label: 'Dashboard Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
    { id: 'add-project', label: 'Add Project', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"></path></svg> },
    { id: 'view-projects', label: 'View Projects', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { id: 'overall', label: 'Overall Project', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> },
    { id: 'kanban', label: 'Project Board', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ padding: '1rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Estimation Pro</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Dashboard</p>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
          >
            {activeView === item.id && (
              <motion.div 
                layoutId="activeNavBackground"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'var(--primary)',
                  borderRadius: '14px',
                  zIndex: 0
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {item.icon}
              {item.label}
            </span>
          </div>
        ))}
      </nav>
      
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 18px', borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--input-border)',
            color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          {theme === 'light' ? (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark Mode</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Light Mode</>
          )}
        </button>
        
        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>v1.2.0 Stable</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
