import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const KanbanBoard = ({ onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = ['Drawing Approved', 'Running Project', 'Remark', 'Completed'];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estimations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      // Optimistic update
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      
      const { error } = await supabase
        .from('estimations')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
      fetchProjects(); // Revert on error
    }
  };

  const getProjectsByStatus = (status) => {
    return projects.filter(p => (p.status || 'Drawing Approved') === status);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner-small" style={{ width: '40px', height: '40px' }}></div>
    </div>
  );

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '1.5rem',
      marginTop: '2rem'
    }}>
      {columns.map(status => (
        <div key={status} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '1rem', border: '1px solid var(--glass-border)', minHeight: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {status}
            </h3>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
              {getProjectsByStatus(status).length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence mode="popLayout">
              {getProjectsByStatus(status).map(project => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5, boxShadow: 'var(--shadow-xl)' }}
                  onClick={() => onSelectProject(project.id)}
                  className="glass-card"
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer', 
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{project.site_name}</div>
                  {project.status === 'Remark' && project.remark && (
                    <div style={{ fontSize: '0.7rem', display: 'inline-block', background: '#fef9c3', color: '#a16207', padding: '2px 8px', borderRadius: '8px', border: '1px solid #fef08a', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {project.remark}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {project.client_name} • {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                       {/* Direction buttons for simple drag simulation */}
                       {status !== 'Drawing Approved' && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); updateProjectStatus(project.id, columns[columns.indexOf(status) - 1]); }}
                           style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                         >
                           ←
                         </button>
                       )}
                       {status !== 'Completed' && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); updateProjectStatus(project.id, columns[columns.indexOf(status) + 1]); }}
                           style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                         >
                           →
                         </button>
                       )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
