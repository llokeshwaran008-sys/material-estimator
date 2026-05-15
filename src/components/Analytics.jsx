import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { supabase } from '../supabaseClient';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch all estimations for timeline
      const { data: projects, error: pError } = await supabase
        .from('estimations')
        .select('project_date, created_at, status');
      
      if (pError) throw pError;

      // Process Timeline Data (Count by Month)
      const months = {};
      projects.forEach(p => {
        const date = new Date(p.project_date || p.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months[monthKey] = (months[monthKey] || 0) + 1;
      });

      const timeline = Object.keys(months).map(m => ({ month: m, projects: months[m] }));
      setTimelineData(timeline);

      // 2. Fetch estimation items for material trends
      const { data: items, error: iError } = await supabase
        .from('estimation_items')
        .select('created_at, carcas_inner_outer_lamp, carcas_inner_lamp_outer_paint_veneer, shutter_lam, shutter_paint_veneer, shutter_veneer_design, shutter_come_moulding');

      if (iError) throw iError;

      // Process Trend Data (R, S, SS over months)
      const trendMonths = {};
      items.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (!trendMonths[monthKey]) trendMonths[monthKey] = { R: 0, S: 0, SS: 0, total: 0 };
        
        Object.values(item).forEach(val => {
          if (val === 'R' || val === 'Regular') trendMonths[monthKey].R++;
          else if (val === 'S' || val === 'Special') trendMonths[monthKey].S++;
          else if (val === 'SS' || val === 'Super Special') trendMonths[monthKey].SS++;
          
          if (['R', 'Regular', 'S', 'Special', 'SS', 'Super Special'].includes(val)) {
            trendMonths[monthKey].total++;
          }
        });
      });

      const trend = Object.keys(trendMonths).map(m => ({
        month: m,
        Regular: Number(((trendMonths[m].R / (trendMonths[m].total || 1)) * 100).toFixed(1)),
        Special: Number(((trendMonths[m].S / (trendMonths[m].total || 1)) * 100).toFixed(1)),
        Super_Special: Number(((trendMonths[m].SS / (trendMonths[m].total || 1)) * 100).toFixed(1))
      }));
      
      setTrendData(trend);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner-small" style={{ width: '40px', height: '40px' }}></div>
    </div>
  );

  if (timelineData.length === 0 && trendData.length === 0) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '5rem' }}>
       <h3 style={{ color: 'var(--text-muted)' }}>No analytics data available yet.</h3>
       <p style={{ marginTop: '1rem' }}>Start adding projects to see trends and volume analytics.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. Timeline Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ padding: '2.5rem', background: 'white' }}
      >
        <h3 style={{ marginBottom: '2rem', color: 'var(--text-main)' }}>Project Pipeline (Volume over Time)</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="projects" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. Material Trends Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card" 
        style={{ padding: '2.5rem', background: 'white' }}
      >
        <h3 style={{ marginBottom: '2rem', color: 'var(--text-main)' }}>Material Trend Analysis (%)</h3>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Regular" stackId="a" fill="#d97706" barSize={60} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Special" stackId="a" fill="#ec4899" barSize={60} radius={[0, 0, 0, 0]} />
              <Bar name="Super Special" dataKey="Super_Special" stackId="a" fill="#4f46e5" barSize={60} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </div>
  );
};

export default Analytics;
