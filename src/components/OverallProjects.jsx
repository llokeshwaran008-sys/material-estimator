import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { supabase } from '../supabaseClient';

const OverallProjects = () => {
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState({ R: 0, S: 0, SS: 0, totalProjects: 0 });
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const chartRef = useRef(null);

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
    fetchOverallData();
  }, []);

  const fetchOverallData = async () => {
    try {
      setLoading(true);

      // 1. Get all projects count
      const { count: projectCount } = await supabase
        .from('estimations')
        .select('*', { count: 'exact', head: true });

      // 2. Get all estimation items
      const { data: items, error } = await supabase
        .from('estimation_items')
        .select('carcas_inner_outer_lamp, carcas_inner_lamp_outer_paint_veneer, shutter_lam, shutter_paint_veneer, shutter_veneer_design, shutter_come_moulding');

      if (error) throw error;

      // 3. Calculate global counts
      const counts = { R: 0, S: 0, SS: 0 };
      items.forEach(item => {
        Object.values(item).forEach(val => {
          if (val === 'R' || val === 'Regular') counts.R++;
          else if (val === 'S' || val === 'Special') counts.S++;
          else if (val === 'SS' || val === 'Super Special') counts.SS++;
        });
      });

      setStats({
        ...counts,
        totalProjects: projectCount || 0
      });

      const total = counts.R + counts.S + counts.SS;

      setAllData([
        { name: 'Regular (R)', value: total > 0 ? Number(((counts.R / total) * 100).toFixed(2)) : 0, color: '#d97706' },
        { name: 'Special (S)', value: total > 0 ? Number(((counts.S / total) * 100).toFixed(2)) : 0, color: '#ec4899' },
        { name: 'Super Special (SS)', value: total > 0 ? Number(((counts.SS / total) * 100).toFixed(2)) : 0, color: '#6366f1' }
      ]);

    } catch (error) {
      console.error("Error fetching overall data:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadHistogram = async () => {
    if (!chartRef.current) return;
    try {
      setLoading(true);

      // Temporarily toggle to light mode to capture a clean white-bg download image
      const originalTheme = document.documentElement.getAttribute('data-theme');
      const wasDark = originalTheme === 'dark';

      if (wasDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        // Let state propagation & chart layout transition complete (150ms is perfect)
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `overall_histogram_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Restore dark mode if it was dark originally
      if (wasDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (error) {
      console.error("Error downloading histogram:", error);
      alert("Failed to download image");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <div className="spinner-small" style={{ width: '40px', height: '40px' }}></div>
    </div>
  );

  return (
    <div className="glass-card">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Overall Project Analytics</h2>
        <p style={{ color: 'var(--text-muted)' }}>Aggregated material distribution across all {stats.totalProjects} projects</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>TOTAL REGULAR (R)</p>
          <h3 style={{ fontSize: '2.5rem', color: '#d97706', marginTop: '0.5rem', fontWeight: 800 }}>{stats.R}</h3>
        </div>
        <div style={{
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>TOTAL SPECIAL (S)</p>
          <h3 style={{ fontSize: '2.5rem', color: '#ec4899', marginTop: '0.5rem', fontWeight: 800 }}>{stats.S}</h3>
        </div>
        <div style={{
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>TOTAL SUPER SPECIAL (SS)</p>
          <h3 style={{ fontSize: '2.5rem', color: '#6366f1', marginTop: '0.5rem', fontWeight: 800 }}>{stats.SS}</h3>
        </div>
      </div>

      <div style={{
        background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
        padding: '2.5rem',
        borderRadius: '24px',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div ref={chartRef} style={{ background: isDark ? 'transparent' : '#ffffff', padding: '10px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '2rem', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 700 }}>Global Material Distribution</h3>
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={80}>
                  {allData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fill: isDark ? '#f1f5f9' : '#1e293b', fontWeight: 800, fontSize: '16px' }}
                    formatter={(value) => `${value}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          onClick={async () => {
            try {
              setLoading(true);
              const { data: allProjects, error: pError } = await supabase.from('estimations').select('*');
              if (pError) throw pError;

              const { data: allItems, error: iError } = await supabase.from('estimation_items').select('*');
              if (iError) throw iError;

              const headers = ["Site Name", "Client Name", "Date", "Status", "Items Count", "Floor Plan", "Site Photo"];

              const getColor = (val) => {
                if (val === 'Regular' || val === 'R') return { bg: '#d97706', text: '#ffffff' };
                if (val === 'Special' || val === 'S') return { bg: '#ec4899', text: '#ffffff' };
                if (val === 'Super Special' || val === 'SS') return { bg: '#4f46e5', text: '#ffffff' };
                return { bg: '#ffffff', text: '#1e293b' };
              };

              const tableRows = allProjects.map(p => {
                const projectItems = allItems.filter(i => i.estimation_id === p.id);
                const statusColor = p.status === 'Running Project' ? { bg: '#dcfce7', text: '#166534' } :
                  p.status === 'Drawing Approved' ? { bg: '#f1f5f9', text: '#64748b' } :
                    p.status === 'Remark' ? { bg: '#fef9c3', text: '#a16207' } :
                      { bg: '#ffffff', text: '#1e293b' };

                return `<tr>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${p.site_name || 'N/A'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${p.client_name || 'N/A'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${p.project_date || 'N/A'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; background-color: ${statusColor.bg}; color: ${statusColor.text};">${p.status === 'Remark' ? (p.remark || 'Remark') : (p.status || 'N/A')}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${projectItems.length}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${p.floor_plan_url || 'N/A'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${p.site_photo_url || 'N/A'}</td>
                </tr>`;
              }).join('');

              const html = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                  <head><meta charset="utf-8"></head>
                  <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #1e293b;">Master Estimation Report</h2>
                    <table border="1" style="border-collapse: collapse; width: 100%;">
                      <thead>
                        <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold; text-transform: uppercase;">
                          ${headers.map(h => `<th style="border: 1px solid #e2e8f0; padding: 10px;">${h}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${tableRows}
                      </tbody>
                    </table>
                  </body>
                </html>
              `;

              const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `master_estimation_report_${new Date().toISOString().split('T')[0]}.xls`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              alert("Master report exported successfully!");
            } catch (err) {
              console.error(err);
              alert("Export failed: " + err.message);
            } finally {
              setLoading(false);
            }
          }}
          className="btn btn-primary"
          style={{ fontSize: '0.8rem', background: '#10b981' }}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Master XLS
        </button>
        <button
          onClick={downloadHistogram}
          className="btn btn-outline"
          style={{ fontSize: '0.8rem', borderColor: '#6366f1', color: '#6366f1' }}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          Download Histogram
        </button>
        <button onClick={fetchOverallData} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Refresh Global Data</button>
      </div>
    </div>
  );
};

export default OverallProjects;
