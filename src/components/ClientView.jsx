import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend } from 'recharts';
import { motion } from 'framer-motion';

const ClientView = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  useEffect(() => {
    // Sync initially
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');

    // Create a MutationObserver to listen for theme changes on root HTML element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isAuthenticated && projectId) fetchProjectDetails();
  }, [isAuthenticated, projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const { data: estimation, error } = await supabase
        .from('estimations')
        .select('*, estimation_items(*)')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProjectInfo(estimation);

      // Process chart data (similar to ProjectDetails.jsx)
      const counts = { R: 0, S: 0, SS: 0 };
      estimation.estimation_items.forEach(item => {
        ['carcas_inner_outer_lamp', 'carcas_inner_lamp_outer_paint_veneer', 'shutter_lam', 'shutter_paint_veneer', 'shutter_veneer_design', 'shutter_come_moulding'].forEach(field => {
          const val = item[field];
          if (val === 'R' || val === 'Regular') counts.R++;
          else if (val === 'S' || val === 'Special') counts.S++;
          else if (val === 'SS' || val === 'Super Special') counts.SS++;
        });
      });

      const total = counts.R + counts.S + counts.SS;
      setChartData([
        { name: 'Regular (R)', value: Number(((counts.R / (total || 1)) * 100).toFixed(2)), count: counts.R, color: '#d97706' },
        { name: 'Special (S)', value: Number(((counts.S / (total || 1)) * 100).toFixed(2)), count: counts.S, color: '#ec4899' },
        { name: 'Super Special (SS)', value: Number(((counts.SS / (total || 1)) * 100).toFixed(2)), count: counts.SS, color: '#6366f1' }
      ]);

    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estimations')
        .select('client_password')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      if (data?.client_password && password.trim() === data.client_password) {
        setIsAuthenticated(true);
      } else {
        alert('Incorrect password! Please check with your architect.');
      }
    } catch (err) {
      alert('Error verifying password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Client Access</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please enter the project password provided by your architect.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>View Estimation</button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}><div className="spinner-small"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{projectInfo?.site_name}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Material Estimation for {projectInfo?.client_name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-card" style={{ 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff', 
          padding: '2rem',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>Material Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    background: isDark ? '#1e293b' : '#ffffff', 
                    color: isDark ? '#f1f5f9' : '#1e293b', 
                    boxShadow: 'var(--shadow-lg)' 
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fill: isDark ? '#f1f5f9' : '#1e293b', fontWeight: 800, fontSize: '10px' }} 
                    formatter={(v) => `${v}%`} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff', 
          padding: '2rem',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>Material Percentage</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {chartData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    background: isDark ? '#1e293b' : '#ffffff', 
                    color: isDark ? '#f1f5f9' : '#1e293b', 
                    boxShadow: 'var(--shadow-lg)' 
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientView;
