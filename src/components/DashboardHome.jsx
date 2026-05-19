import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatusBadgeDropdown from './StatusBadgeDropdown';

const DashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({ totalSites: 0, running: 0, pending: 0, completed: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectStats, setSelectedProjectStats] = useState({ total: 0, R: 0, S: 0, SS: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchProjectStats = async (project) => {
    setSelectedProject(project);
    setStatsLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('estimation_items')
        .select('carcas_inner_outer_lamp, carcas_inner_lamp_outer_paint_veneer, shutter_lam, shutter_paint_veneer, shutter_veneer_design, shutter_come_moulding')
        .eq('estimation_id', project.id);
      
      if (error) throw error;
      
      let counts = { R: 0, S: 0, SS: 0 };
      items.forEach(item => {
        ['carcas_inner_outer_lamp', 'carcas_inner_lamp_outer_paint_veneer', 'shutter_lam', 'shutter_paint_veneer', 'shutter_veneer_design', 'shutter_come_moulding'].forEach(field => {
          const val = item[field];
          if (val === 'R' || val === 'Regular') counts.R++;
          else if (val === 'S' || val === 'Special') counts.S++;
          else if (val === 'SS' || val === 'Super Special') counts.SS++;
        });
      });

      setSelectedProjectStats({
        total: items.length,
        R: counts.R,
        S: counts.S,
        SS: counts.SS
      });
    } catch (err) {
      console.error('Error fetching project items stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Projects
      const { data: projects, error: pError } = await supabase
        .from('estimations')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) throw pError;

      setStats({
        totalSites: projects.length,
        running: projects.filter(p => p.status === 'Running Project').length,
        pending: projects.filter(p => p.status === 'Drawing Approved' || p.status === 'Remark').length,
        completed: projects.filter(p => p.status === 'Completed').length
      });

      setRecentProjects(projects);
      if (projects.length > 0) {
        fetchProjectStats(projects[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdated = (projectId, newStatus, newRemark) => {
    setRecentProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus, remark: newRemark } : p));
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => prev ? { ...prev, status: newStatus, remark: newRemark } : null);
    }
    fetchDashboardData();
  };

  return (
    <div className="dashboard-home">
      {/* 1. Quick Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
      >
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Active Sites</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.totalSites}</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #10b981' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Running Project</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.running}</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.pending}</h2>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #6366f1' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Completed</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>{stats.completed}</h2>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* 2. Recent Activity */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>All Projects</h3>
            <button onClick={() => onNavigate('view-projects')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>View All →</button>
          </div>

          {loading ? (
            <div className="spinner-small" style={{ margin: '2rem auto' }}></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentProjects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => fetchProjectStats(project)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    background: selectedProject?.id === project.id ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-main)', 
                    borderRadius: '12px', 
                    border: selectedProject?.id === project.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{project.site_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{project.client_name} • {new Date(project.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadgeDropdown project={project} onStatusUpdated={handleStatusUpdated} />
                </div>
              ))}
              {recentProjects.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent activity.</p>}
            </div>
          )}
        </div>

        {/* 3. Stats Sidebar Breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '320px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '18px', background: 'var(--primary)', borderRadius: '4px' }}></span>
            Project Estimation Summary
          </h3>
          
          {selectedProject ? (
            statsLoading ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
                <div className="spinner-small" style={{ width: '30px', height: '30px' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading project stats...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{selectedProject.site_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client: {selectedProject.client_name}</div>
                </div>

                {/* Grid for Quick Counts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ITEMS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{selectedProjectStats.total}</div>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>REGULAR (R)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>{selectedProjectStats.R}</div>
                  </div>
                  <div style={{ background: '#fdf2f8', padding: '1rem', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                    <div style={{ fontSize: '0.75rem', color: '#db2777', fontWeight: 600 }}>SPECIAL (S)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#db2777', marginTop: '4px' }}>{selectedProjectStats.S}</div>
                  </div>
                  <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                    <div style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 600 }}>SUPER SPECIAL (SS)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4338ca', marginTop: '4px' }}>{selectedProjectStats.SS}</div>
                  </div>
                </div>


                {/* Visual Distribution Bars */}
                {selectedProjectStats.total > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>MATERIAL DISTRIBUTION</div>
                    
                    {/* Progress Bars */}
                    {(() => {
                      const totalEstimates = selectedProjectStats.R + selectedProjectStats.S + selectedProjectStats.SS;
                      const getPct = (val) => totalEstimates > 0 ? ((val / totalEstimates) * 100).toFixed(0) : 0;
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>
                              <span>Regular (R)</span>
                              <span>{getPct(selectedProjectStats.R)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${getPct(selectedProjectStats.R)}%`, height: '100%', background: '#d97706', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>
                              <span>Special (S)</span>
                              <span>{getPct(selectedProjectStats.S)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${getPct(selectedProjectStats.S)}%`, height: '100%', background: '#ec4899', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>
                              <span>Super Special (SS)</span>
                              <span>{getPct(selectedProjectStats.SS)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${getPct(selectedProjectStats.SS)}%`, height: '100%', background: '#4f46e5', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Select a project from the list to preview details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default DashboardHome;
