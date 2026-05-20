import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient';

const CustomXAxisTick = ({ x, y, payload }) => {
  let color = 'var(--text-muted)';
  if (payload.value.includes('Regular')) color = '#d97706';
  else if (payload.value.includes('Super Special')) color = '#6366f1';
  else if (payload.value.includes('Special')) color = '#ec4899';

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill={color} style={{ fontSize: 10, fontWeight: 700 }}>
        {payload.value}
      </text>
    </g>
  );
};

const ProjectDetails = ({ projectId, onBack, onNavigate }) => {
  const chartRef = useRef(null);
  const pieChartRef = useRef(null);
  const containerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [useManualChart, setUseManualChart] = useState(false);
  const [manualValues, setManualValues] = useState({ R: 33.33, S: 33.33, SS: 33.34 });
  const [remarkText, setRemarkText] = useState('');
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  // Share with Client modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareSaving, setShareSaving] = useState(false);
  const [shareSaved, setShareSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const options = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Special', label: 'Special' },
    { value: 'Super Special', label: 'Super Special' }
  ];

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
    if (projectId) fetchProjectDetails();
  }, [projectId]);

  useEffect(() => {
    updateChartData();
  }, [items]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const { data: estimation, error: estimationError } = await supabase
        .from('estimations')
        .select('*')
        .eq('id', projectId)
        .single();

      if (estimationError) throw estimationError;
      setProjectInfo(estimation);
      setRemarkText(estimation.remark || '');
      setUseManualChart(estimation.use_manual_chart || false);
      if (estimation.use_manual_chart) {
        setManualValues({
          R: estimation.manual_r || 33.33,
          S: estimation.manual_s || 33.33,
          SS: estimation.manual_ss || 33.34
        });
      }

      const { data: estimationItems, error: itemsError } = await supabase
        .from('estimation_items')
        .select('*')
        .eq('estimation_id', projectId)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;
      
      // Transform keys to match internal state naming if necessary, 
      // but let's just use the DB column names directly for simplicity in items state
      setItems(estimationItems.map(item => ({
        id: item.id,
        item_name: item.item_name,
        carcas_inner_outer_lamp: item.carcas_inner_outer_lamp,
        carcas_inner_outer_lamp_img: item.carcas_inner_outer_lamp_img,
        carcas_inner_lamp_outer_paint_veneer: item.carcas_inner_lamp_outer_paint_veneer,
        carcas_inner_lamp_outer_paint_veneer_img: item.carcas_inner_lamp_outer_paint_veneer_img,
        shutter_lam: item.shutter_lam,
        shutter_lam_img: item.shutter_lam_img,
        shutter_paint_veneer: item.shutter_paint_veneer,
        shutter_paint_veneer_img: item.shutter_paint_veneer_img,
        shutter_veneer_design: item.shutter_veneer_design,
        shutter_veneer_design_img: item.shutter_veneer_design_img,
        shutter_come_moulding: item.shutter_come_moulding,
        shutter_come_moulding_img: item.shutter_come_moulding_img
      })));

    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = () => {
    if (useManualChart) {
      setChartData([
        { name: 'Regular (R)', value: Number(manualValues.R), color: '#d97706' },
        { name: 'Special (S)', value: Number(manualValues.S), color: '#ec4899' },
        { name: 'Super Special (SS)', value: Number(manualValues.SS), color: '#6366f1' }
      ]);
      return;
    }

    const counts = { R: 0, S: 0, SS: 0 };
    items.forEach(item => {
      ['carcas_inner_outer_lamp', 'carcas_inner_lamp_outer_paint_veneer', 'shutter_lam', 'shutter_paint_veneer', 'shutter_veneer_design', 'shutter_come_moulding'].forEach(field => {
        const val = item[field];
        if (val === 'R' || val === 'Regular') counts.R++;
        else if (val === 'S' || val === 'Special') counts.S++;
        else if (val === 'SS' || val === 'Super Special') counts.SS++;
      });
    });

    const total = counts.R + counts.S + counts.SS;
    if (total === 0) {
      setChartData([
        { name: 'Regular (R)', value: 0, color: '#d97706' },
        { name: 'Special (S)', value: 0, color: '#ec4899' },
        { name: 'Super Special (SS)', value: 0, color: '#6366f1' }
      ]);
      return;
    }

    setChartData([
      { name: 'Regular (R)', value: Number(((counts.R / total) * 100).toFixed(2)), count: counts.R, color: '#d97706' },
      { name: 'Special (S)', value: Number(((counts.S / total) * 100).toFixed(2)), count: counts.S, color: '#ec4899' },
      { name: 'Super Special (SS)', value: Number(((counts.SS / total) * 100).toFixed(2)), count: counts.SS, color: '#6366f1' }
    ]);
  };

  useEffect(() => {
    updateChartData();
  }, [useManualChart, manualValues]);

  const addRow = () => {
    setItems([...items, {
      id: `new-${Date.now()}`,
      item_name: '',
      carcas_inner_outer_lamp: '',
      carcas_inner_outer_lamp_img: null,
      carcas_inner_lamp_outer_paint_veneer: '',
      carcas_inner_lamp_outer_paint_veneer_img: null,
      shutter_lam: '',
      shutter_lam_img: null,
      shutter_paint_veneer: '',
      shutter_paint_veneer_img: null,
      shutter_veneer_design: '',
      shutter_veneer_design_img: null,
      shutter_come_moulding: '',
      shutter_come_moulding_img: null
    }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    const password = prompt("Enter password to delete:");
    if (password === "iipl@26") {
      setItems(items.filter(item => item.id !== id));
    } else if (password !== null) {
      alert("Incorrect password!");
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      // 0. Update estimation record with chart settings
      await supabase.from('estimations').update({
        use_manual_chart: useManualChart,
        manual_r: manualValues.R,
        manual_s: manualValues.S,
        manual_ss: manualValues.SS,
        status: projectInfo.status,
        remark: remarkText
      }).eq('id', projectId);

      // 1. Delete existing items
      await supabase.from('estimation_items').delete().eq('estimation_id', projectId);

      // 2. Insert updated items
      const itemsToInsert = items.map((item, index) => ({
        estimation_id: projectId,
        item_name: item.item_name,
        carcas_inner_outer_lamp: item.carcas_inner_outer_lamp,
        carcas_inner_outer_lamp_img: item.carcas_inner_outer_lamp_img,
        carcas_inner_lamp_outer_paint_veneer: item.carcas_inner_lamp_outer_paint_veneer,
        carcas_inner_lamp_outer_paint_veneer_img: item.carcas_inner_lamp_outer_paint_veneer_img,
        shutter_lam: item.shutter_lam,
        shutter_lam_img: item.shutter_lam_img,
        shutter_paint_veneer: item.shutter_paint_veneer,
        shutter_paint_veneer_img: item.shutter_paint_veneer_img,
        shutter_veneer_design: item.shutter_veneer_design,
        shutter_veneer_design_img: item.shutter_veneer_design_img,
        shutter_come_moulding: item.shutter_come_moulding,
        shutter_come_moulding_img: item.shutter_come_moulding_img,
        sort_order: index
      }));

      const { error } = await supabase.from('estimation_items').insert(itemsToInsert);
      if (error) throw error;

      alert("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const headers = ["Item Name", "Carcass Inner / outer Lam", "Carcass Inner Outer Paint Venner", "Shutter Lam", "Shutter Paint Venner", "Shutter Venner Design fluted,Ribbed", "Shutter Come Moulding"];
    
    const getColor = (val) => {
      if (val === 'Regular' || val === 'R') return { bg: '#d97706', text: '#ffffff' };
      if (val === 'Special' || val === 'S') return { bg: '#ec4899', text: '#ffffff' };
      if (val === 'Super Special' || val === 'SS') return { bg: '#4f46e5', text: '#ffffff' };
      return { bg: '#ffffff', text: '#1e293b' };
    };

    const tableRows = items.map(item => {
      const rowData = [item.item_name, item.carcas_inner_outer_lamp, item.carcas_inner_lamp_outer_paint_veneer, item.shutter_lam, item.shutter_paint_veneer, item.shutter_veneer_design, item.shutter_come_moulding];
      
      return `<tr>${rowData.map((val, idx) => {
        const { bg, text } = idx >= 1 ? getColor(val) : { bg: '#ffffff', text: '#1e293b' };
        return `<td style="background-color: ${bg}; color: ${text}; border: 1px solid #e2e8f0; padding: 8px;">${val || 'N/A'}</td>`;
      }).join('')}</tr>`;
    }).join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Project Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body style="font-family: Arial, sans-serif;">
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
    link.download = `${projectInfo?.site_name || 'project'}_report.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHistogram = async () => {
    if (!chartRef.current) return;
    try {
      const originalTheme = document.documentElement.getAttribute('data-theme');
      const wasDark = originalTheme === 'dark';

      if (wasDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 3, useCORS: true });
      const link = document.createElement('a');
      link.download = `histogram_${projectInfo?.site_name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (wasDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPieChart = async () => {
    if (!pieChartRef.current) return;
    try {
      const originalTheme = document.documentElement.getAttribute('data-theme');
      const wasDark = originalTheme === 'dark';

      if (wasDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const canvas = await html2canvas(pieChartRef.current, { backgroundColor: '#ffffff', scale: 3, useCORS: true });
      const link = document.createElement('a');
      link.download = `pie_chart_${projectInfo?.site_name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (wasDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPDF = async () => {
    const element = containerRef.current;
    const buttons = element.querySelectorAll('.btn, .delete-btn');
    buttons.forEach(b => b.style.display = 'none');
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${projectInfo?.site_name}_report.pdf`);
    } finally {
      buttons.forEach(b => b.style.display = '');
    }
  };

  const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
      <div className="full-image-overlay" onClick={onClose}>
        <div className="full-image-content" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={onClose}>×</button>
          <img src={imageUrl} alt="Full Screen" />
        </div>
      </div>
    );
  };

  const ImageUpload = ({ rowId, field, currentImage, choiceSelected }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);

    const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
        updateItem(rowId, `${field}_img`, publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image: ' + error.message);
      } finally {
        setUploading(false);
      }
    };

    const handleClick = () => {
      if (!choiceSelected) {
        alert("Please select a choice (R, S, or SS) first!");
        return;
      }
      if (currentImage) {
        setShowFullImage(true);
      } else {
        fileInputRef.current.click();
      }
    };

    return (
      <div className="image-upload-container">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        <button
          onClick={handleClick}
          className={`upload-field-btn ${!choiceSelected ? 'disabled' : ''}`}
          disabled={uploading}
          style={{
            background: !choiceSelected ? '#f1f5f9' : (uploading ? '#e2e8f0' : (currentImage ? 'var(--primary)' : '#f1f5f9')),
            border: 'none', borderRadius: '6px', padding: '6px', cursor: (!choiceSelected || uploading) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px',
            opacity: !choiceSelected ? 0.5 : 1
          }}
        >
          {uploading ? <div className="spinner-small"></div> : currentImage ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={!choiceSelected ? "#cbd5e1" : "#94a3b8"} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>}
        </button>
        {currentImage && (
          <div className="img-preview-tooltip" onClick={() => setShowFullImage(true)} style={{ cursor: 'pointer' }}>
             <img src={currentImage} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
        )}
        {showFullImage && <ImageModal imageUrl={currentImage} onClose={() => setShowFullImage(false)} />}
      </div>
    );
  };

  if (loading && items.length === 0) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div className="spinner-small" style={{ width: '40px', height: '40px' }}></div>
    </div>
  );

  const handleSaveSharePassword = async () => {
    if (!sharePassword.trim()) { alert('Please enter a password!'); return; }
    try {
      setShareSaving(true);
      const { error } = await supabase.from('estimations').update({ client_password: sharePassword.trim() }).eq('id', projectId);
      if (error) throw error;
      setProjectInfo({ ...projectInfo, client_password: sharePassword.trim() });
      setShareSaved(true);
    } catch (err) {
      alert('Failed to save password: ' + err.message);
    } finally {
      setShareSaving(false);
    }
  };

  const getShareLink = () => `${window.location.origin}${window.location.pathname}?client=${projectId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={onBack} className="btn btn-outline" style={{ fontSize: '0.8rem', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to List
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setSharePassword(projectInfo?.client_password || ''); setShareSaved(false); setLinkCopied(false); setShowShareModal(true); }} className="btn btn-outline" style={{ borderColor: '#6366f1', color: '#6366f1', padding: '8px 16px', fontSize: '0.8rem', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
            Share with Client
          </button>
          <button onClick={downloadExcel} className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981', padding: '8px 16px', fontSize: '0.8rem' }}>Excel</button>
          <button onClick={downloadHistogram} className="btn btn-outline" style={{ borderColor: '#6366f1', color: '#6366f1', padding: '8px 16px', fontSize: '0.8rem' }}>Histogram</button>
          <button onClick={downloadPieChart} className="btn btn-outline" style={{ borderColor: '#ec4899', color: '#ec4899', padding: '8px 16px', fontSize: '0.8rem' }}>Pie Chart</button>
          <button onClick={downloadPDF} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>PDF Report</button>
          <button onClick={handleUpdate} className="btn btn-primary" style={{ background: '#10b981', padding: '8px 16px', fontSize: '0.8rem' }}>Save Changes</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{projectInfo?.site_name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Client: <strong>{projectInfo?.client_name}</strong> | Date: <strong>{new Date(projectInfo?.project_date).toLocaleDateString()}</strong></p>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span className={`badge badge-${(projectInfo?.status || 'Drawing Approved').toLowerCase().replace(' ', '-')}`} style={{ alignSelf: 'flex-start' }}>
              {projectInfo?.status === 'Remark' ? (remarkText || 'Remark') : (projectInfo?.status || 'Drawing Approved')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Update Status:</label>
              <select 
                value={projectInfo?.status || 'Drawing Approved'} 
                onChange={(e) => setProjectInfo({ ...projectInfo, status: e.target.value })}
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="Drawing Approved">Drawing Approved</option>
                <option value="Running Project">Running Project</option>
                <option value="Remark">Remark</option>
                <option value="Completed">Completed</option>
              </select>
              {projectInfo?.status === 'Remark' && (
                <input 
                  type="text" 
                  placeholder="Enter custom remark..." 
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    outline: 'none',
                    width: '180px'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Project Attachments</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {projectInfo?.floor_plan_url ? (
              <a href={projectInfo.floor_plan_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                View Floor Plan
              </a>
            ) : (
              <div style={{ flex: 1, padding: '10px', border: '1px dashed var(--input-border)', borderRadius: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>No Floor Plan</div>
            )}
            
            {projectInfo?.site_photo_url ? (
              <a href={projectInfo.site_photo_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                View Site Photo
              </a>
            ) : (
              <div style={{ flex: 1, padding: '10px', border: '1px dashed var(--input-border)', borderRadius: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>No Site Photo</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Items</p>
          <h4 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '4px' }}>{items.length}</h4>
        </div>
        <div style={{ 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          border: isDark ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid #d9770633',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Regular (R)</p>
          <h4 style={{ fontSize: '1.5rem', color: '#d97706', marginTop: '4px' }}>{chartData.find(d => d.name === 'Regular (R)')?.count || 0}</h4>
        </div>
        <div style={{ 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          border: isDark ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid #ec489933',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Special (S)</p>
          <h4 style={{ fontSize: '1.5rem', color: '#ec4899', marginTop: '4px' }}>{chartData.find(d => d.name === 'Special (S)')?.count || 0}</h4>
        </div>
        <div style={{ 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #6366f133',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Super Special (SS)</p>
          <h4 style={{ fontSize: '1.5rem', color: '#6366f1', marginTop: '4px' }}>{chartData.find(d => d.name === 'Super Special (SS)')?.count || 0}</h4>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Item Name</th>
                <th>Carcass Inner / outer Lam</th>
                <th>Carcass Inner Outer Paint Venner</th>
                <th>Shutter Lam</th>
                <th>Shutter Paint Venner</th>
                <th>Shutter Venner Design fluted,Ribbed</th>
                <th>Shutter Come Moulding</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><input type="text" className="input-field" value={item.item_name} onChange={(e) => updateItem(item.id, 'item_name', e.target.value)} /></td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={item.carcas_inner_outer_lamp} onChange={(e) => updateItem(item.id, 'carcas_inner_outer_lamp', e.target.value)}>
                        <option value="">Choice...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ImageUpload rowId={item.id} field="carcas_inner_outer_lamp" currentImage={item.carcas_inner_outer_lamp_img} choiceSelected={!!item.carcas_inner_outer_lamp} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={item.carcas_inner_lamp_outer_paint_veneer} onChange={(e) => updateItem(item.id, 'carcas_inner_lamp_outer_paint_veneer', e.target.value)}>
                        <option value="">Choice...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ImageUpload rowId={item.id} field="carcas_inner_lamp_outer_paint_veneer" currentImage={item.carcas_inner_lamp_outer_paint_veneer_img} choiceSelected={!!item.carcas_inner_lamp_outer_paint_veneer} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={item.shutter_lam} onChange={(e) => updateItem(item.id, 'shutter_lam', e.target.value)}>
                        <option value="">Choice...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ImageUpload rowId={item.id} field="shutter_lam" currentImage={item.shutter_lam_img} choiceSelected={!!item.shutter_lam} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={item.shutter_paint_veneer} onChange={(e) => updateItem(item.id, 'shutter_paint_veneer', e.target.value)}>
                        <option value="">Choice...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ImageUpload rowId={item.id} field="shutter_paint_veneer" currentImage={item.shutter_paint_veneer_img} choiceSelected={!!item.shutter_paint_veneer} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={item.shutter_veneer_design} onChange={(e) => updateItem(item.id, 'shutter_veneer_design', e.target.value)}>
                        <option value="">Choice...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ImageUpload rowId={item.id} field="shutter_veneer_design" currentImage={item.shutter_veneer_design_img} choiceSelected={!!item.shutter_veneer_design} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={item.shutter_come_moulding} onChange={(e) => updateItem(item.id, 'shutter_come_moulding', e.target.value)}>
                        <option value="">Choice...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ImageUpload rowId={item.id} field="shutter_come_moulding" currentImage={item.shutter_come_moulding_img} choiceSelected={!!item.shutter_come_moulding} />
                    </div>
                  </td>
                  <td><button onClick={() => removeItem(item.id)} className="delete-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button onClick={addRow} className="btn btn-outline" style={{ width: '100%', maxWidth: '200px' }}>+ Add New Item</button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Chart Distribution Settings</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manual Override</span>
            <input 
              type="checkbox" 
              checked={useManualChart} 
              onChange={(e) => setUseManualChart(e.target.checked)} 
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', opacity: useManualChart ? 1 : 0.5, pointerEvents: useManualChart ? 'all' : 'none' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', display: 'block', marginBottom: '4px' }}>REGULAR %</label>
            <input 
              type="number" 
              className="input-field" 
              value={manualValues.R} 
              onChange={(e) => setManualValues({...manualValues, R: e.target.value})}
              min="0" max="100"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ec4899', display: 'block', marginBottom: '4px' }}>SPECIAL %</label>
            <input 
              type="number" 
              className="input-field" 
              value={manualValues.S} 
              onChange={(e) => setManualValues({...manualValues, S: e.target.value})}
              min="0" max="100"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', display: 'block', marginBottom: '4px' }}>SUPER SPECIAL %</label>
            <input 
              type="number" 
              className="input-field" 
              value={manualValues.SS} 
              onChange={(e) => setManualValues({...manualValues, SS: e.target.value})}
              min="0" max="100"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={() => setManualValues({ R: 33.33, S: 33.33, SS: 33.34 })}
              className="btn btn-outline"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              Equalize (33%)
            </button>
          </div>
        </div>
        {useManualChart && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: (Number(manualValues.R) + Number(manualValues.S) + Number(manualValues.SS)).toFixed(2) === "100.00" ? "#10b981" : "#ef4444", fontWeight: 600 }}>
              Total: {(Number(manualValues.R) + Number(manualValues.S) + Number(manualValues.SS)).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-card" style={{ 
          padding: '0', 
          overflow: 'hidden',
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div ref={chartRef} style={{ background: isDark ? 'transparent' : '#ffffff', padding: '2.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15px', right: '20px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>Material Legend</div>
              {chartData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.name}</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: item.color }}></div>
                </div>
              ))}
            </div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 700, marginBottom: projectInfo?.site_name ? '0.25rem' : '2rem' }}>Material Distribution</h3>
            {projectInfo?.site_name && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase' }}>Site: {projectInfo.site_name}</div>}
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: isDark ? '#1e293b' : '#ffffff', 
                      color: isDark ? '#f1f5f9' : '#1e293b', 
                      boxShadow: 'var(--shadow-lg)' 
                    }}
                    formatter={(value, name, props) => props?.payload ? [`Count: ${props.payload.count}`, `${name}: ${value}%`] : [`${name}: ${value}%`]} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fill: isDark ? '#f1f5f9' : '#1e293b', fontWeight: 800, fontSize: '12px' }} 
                      formatter={(val, entry) => entry?.payload ? `${entry.payload.count} (${val}%)` : `${val}%`} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="glass-card" style={{ 
          padding: '2.5rem', 
          background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div ref={pieChartRef} style={{ background: isDark ? 'transparent' : '#ffffff', position: 'relative' }}>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', textAlign: 'center', fontWeight: 700, marginBottom: projectInfo?.site_name ? '0.25rem' : '1.5rem' }}>Material Percentage</h3>
            {projectInfo?.site_name && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center', textTransform: 'uppercase' }}>Site: {projectInfo.site_name}</div>}
            <div style={{ height: '300px', width: '100%' }}>
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
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ color: 'var(--text-main)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Share with Client Modal */}
      {showShareModal && (
        <div onClick={() => setShowShareModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '460px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Share with Client</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{projectInfo?.site_name}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                color: 'var(--text-muted)', lineHeight: 1, padding: '4px'
              }}>×</button>
            </div>

            {/* Step 1 — Set Password */}
            <div style={{
              background: isDark ? 'rgba(99,102,241,0.1)' : '#f8faff',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Step 1 — Set Client Password
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 1234567"
                  value={sharePassword}
                  onChange={e => { setSharePassword(e.target.value); setShareSaved(false); }}
                  style={{ flex: 1, fontSize: '1rem', letterSpacing: '0.05em' }}
                />
                <button
                  onClick={handleSaveSharePassword}
                  disabled={shareSaving}
                  style={{
                    background: shareSaved ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', borderRadius: '10px', color: '#fff', padding: '0 1.25rem',
                    fontWeight: 700, fontSize: '0.85rem', cursor: shareSaving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                >
                  {shareSaving ? <div className="spinner-small" style={{ width: '16px', height: '16px' }}></div>
                    : shareSaved ? '✓ Saved!' : 'Save'}
                </button>
              </div>
              {shareSaved && (
                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
                  ✓ Password saved to database!
                </p>
              )}
            </div>

            {/* Step 2 — Copy Link */}
            <div style={{
              background: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf9',
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Step 2 — Copy & Send Link to Client
              </p>
              <div style={{
                background: isDark ? 'rgba(0,0,0,0.3)' : '#e8f5f0', borderRadius: '10px', padding: '0.75rem',
                fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '0.75rem',
                fontFamily: 'monospace'
              }}>
                {getShareLink()}
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  width: '100%', background: linkCopied ? '#10b981' : 'linear-gradient(135deg,#10b981,#059669)',
                  border: 'none', borderRadius: '10px', color: '#fff', padding: '0.75rem',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                {linkCopied ? '✓ Link Copied!' : 'Copy Client Link'}
              </button>
            </div>

            {/* Info Box */}
            <div style={{
              fontSize: '0.78rem', color: 'var(--text-muted)', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderRadius: '10px', padding: '1rem', lineHeight: 1.6
            }}>
              <strong style={{ color: 'var(--text-main)' }}>How it works:</strong><br/>
              1. Save the password above 💾<br/>
              2. Copy the link & send it to your client 🔗<br/>
              3. Also share the password separately 🔑<br/>
              4. Client opens the link, enters the password → Views estimation ✅
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
