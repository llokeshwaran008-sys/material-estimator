import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import StatusBadgeDropdown from './StatusBadgeDropdown';

const ProjectList = ({ onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProjects = projects.filter(p => 
    p.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && projects.length === 0) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div className="spinner-small" style={{ width: '40px', height: '40px' }}></div>
    </div>
  );

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Project History</h2>
          <p style={{ color: 'var(--text-muted)' }}>List of all previously saved estimations</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search site or client..." 
              className="input-field" 
              style={{ paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={fetchProjects} className="btn btn-outline" style={{ fontSize: '0.8rem' }} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Client Name</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No projects match your search.' : 'No projects found. Go to "Add Project" to create one.'}
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td style={{ fontWeight: 600 }}>{project.site_name}</td>
                  <td>{project.client_name}</td>
                  <td>{new Date(project.project_date).toLocaleDateString()}</td>
                  <td>
                    <StatusBadgeDropdown 
                      project={project} 
                      onStatusUpdated={(projectId, newStatus, newRemark) => {
                        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus, remark: newRemark } : p));
                      }} 
                    />
                  </td>
                  <td style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                      <button 
                        onClick={() => onSelectProject(project.id)}
                        className="btn btn-primary" 
                        style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        disabled={loading}
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>


  );
};

export default ProjectList;
