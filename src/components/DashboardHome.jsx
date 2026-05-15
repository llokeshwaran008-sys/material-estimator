import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const DashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({ totalSites: 0, pending: 0, totalMaterials: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Projects
      const { data: projects, error: pError } = await supabase
        .from('estimations')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) throw pError;

      // 2. Fetch Items for material count
      const { data: items, error: iError } = await supabase
        .from('estimation_items')
        .select('id');

      if (iError) throw iError;

      setStats({
        totalSites: projects.length,
        pending: projects.filter(p => p.status === 'Draft' || p.status === 'Ordered').length,
        totalMaterials: items.length
      });

      setRecentProjects(projects.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-home">
      {/* 1. Quick Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
      >
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Active Sites</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.totalSites}</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending / In Progress</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.pending}</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #10b981' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Items Estimated</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.totalMaterials}</h2>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* 2. Recent Activity */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Recent Projects</h3>
            <button onClick={() => onNavigate('view-projects')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>View All →</button>
          </div>

          {loading ? (
            <div className="spinner-small" style={{ margin: '2rem auto' }}></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentProjects.map(project => (
                <div key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{project.site_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{project.client_name} • {new Date(project.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge badge-${(project.status || 'Draft').toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{project.status || 'Draft'}</span>
                </div>
              ))}
              {recentProjects.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent activity.</p>}
            </div>
          )}
        </div>

        {/* 3. Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('add-project')}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
              padding: '2rem', borderRadius: '24px', color: 'white', cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
              display: 'flex', flexDirection: 'column', gap: '0.5rem'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>New Project</h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Create a fresh material estimation in minutes.</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('kanban')}
            style={{
              background: 'var(--table-row-bg)',
              padding: '2rem', borderRadius: '24px', border: '1px solid var(--input-border)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem'
            }}
          >
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Project Board</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage your workflow with Kanban view.</p>
          </motion.div>

          {/* Action card removed */}
        </div>
      </div>
    </div>
  );
};


export default DashboardHome;
