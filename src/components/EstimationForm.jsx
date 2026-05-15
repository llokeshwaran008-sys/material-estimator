import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend, Sector } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient';

const EstimationForm = () => {
  const chartRef = useRef(null);
  const pieChartRef = useRef(null);
  const pdfContainerRef = useRef(null);

  // State
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Draft');
  const [floorPlanUrl, setFloorPlanUrl] = useState(null);
  const [sitePhotoUrl, setSitePhotoUrl] = useState(null);
  const [useManualChart, setUseManualChart] = useState(false);
  const [manualValues, setManualValues] = useState({ R: 33.33, S: 33.33, SS: 33.34 });
  const [rows, setRows] = useState([
    {
      id: 1,
      name: '',
      carcasInnerOuterLamp: '',
      carcasInnerOuterLampImg: null,
      carcasInnerLampOuterPaintVeneer: '',
      carcasInnerLampOuterPaintVeneerImg: null,
      shutterLam: '',
      shutterLamImg: null,
      shutterPaintVeneer: '',
      shutterPaintVeneerImg: null,
      shutterVeneerDesign: '',
      shutterVeneerDesignImg: null,
      shutterComeMoudding: '',
      shutterComeMouddingImg: null
    }
  ]);

  // Load from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem('estimation_pro_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.rows) setRows(parsed.rows);
        if (parsed.siteName) setSiteName(parsed.siteName);
        if (parsed.clientName) setClientName(parsed.clientName);
        if (parsed.projectDate) setProjectDate(parsed.projectDate);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.floorPlanUrl) setFloorPlanUrl(parsed.floorPlanUrl);
        if (parsed.sitePhotoUrl) setSitePhotoUrl(parsed.sitePhotoUrl);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    const dataToSave = { rows, siteName, clientName, projectDate, status, floorPlanUrl, sitePhotoUrl };
    localStorage.setItem('estimation_pro_data', JSON.stringify(dataToSave));
  }, [rows, siteName, clientName, projectDate]);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now(),
      name: '',
      carcasInnerOuterLamp: '',
      carcasInnerOuterLampImg: null,
      carcasInnerLampOuterPaintVeneer: '',
      carcasInnerLampOuterPaintVeneerImg: null,
      shutterLam: '',
      shutterLamImg: null,
      shutterPaintVeneer: '',
      shutterPaintVeneerImg: null,
      shutterVeneerDesign: '',
      shutterVeneerDesignImg: null,
      shutterComeMoudding: '',
      shutterComeMouddingImg: null
    }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const removeRow = (id) => {
    const password = prompt("Enter password to delete:");
    if (password === "iipl@26") {
      setRows(rows.filter(row => row.id !== id));
    } else if (password !== null) {
      alert("Incorrect password!");
    }
  };


  const downloadExcel = () => {
    const headers = [
      "Site Name", "Client Name", "Date", "Item Name",
      "Carcass Inner / outer Lam", "Carcass Inner Outer Paint Venner",
      "Shutter Lam", "Shutter Paint Venner",
      "Shutter Venner Design fluted,Ribbed", "Shutter Come Moulding"
    ];

    const getColor = (val) => {
      if (val === 'Regular' || val === 'R') return { bg: '#d97706', text: '#ffffff' };
      if (val === 'Special' || val === 'S') return { bg: '#ec4899', text: '#ffffff' };
      if (val === 'Super Special' || val === 'SS') return { bg: '#4f46e5', text: '#ffffff' };
      return { bg: '#ffffff', text: '#1e293b' };
    };

    const tableRows = rows.map(row => {
      const rowData = [
        siteName, clientName, projectDate, row.name,
        row.carcasInnerOuterLamp, row.carcasInnerLampOuterPaintVeneer,
        row.shutterLam, row.shutterPaintVeneer,
        row.shutterVeneerDesign, row.shutterComeMoudding
      ];

      return `<tr>${rowData.map((val, idx) => {
        const { bg, text } = idx >= 4 ? getColor(val) : { bg: '#ffffff', text: '#1e293b' };
        return `<td style="background-color: ${bg}; color: ${text}; border: 1px solid #e2e8f0; padding: 8px;">${val || 'N/A'}</td>`;
      }).join('')}</tr>`;
    }).join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
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
    link.download = `${siteName || 'material'}_report.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHistogram = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 3 });
    const link = document.createElement('a');
    link.download = `histogram_${siteName || 'project'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadPieChart = async () => {
    if (!pieChartRef.current) return;
    const canvas = await html2canvas(pieChartRef.current, { backgroundColor: '#ffffff', scale: 3 });
    const link = document.createElement('a');
    link.download = `pie_chart_${siteName || 'project'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSave = async () => {
    try {
      // 1. Insert into estimations table
      const { data: estimationData, error: estimationError } = await supabase
        .from('estimations')
        .insert([{
          site_name: siteName,
          client_name: clientName,
          project_date: projectDate,
          status: status,
          floor_plan_url: floorPlanUrl,
          site_photo_url: sitePhotoUrl,
          use_manual_chart: useManualChart,
          manual_r: manualValues.R,
          manual_s: manualValues.S,
          manual_ss: manualValues.SS
        }])
        .select();

      if (estimationError) throw estimationError;

      const estimationId = estimationData[0].id;

      // 2. Prepare items for insertion
      const itemsToInsert = rows.map((row, index) => ({
        estimation_id: estimationId,
        item_name: row.name,
        carcas_inner_outer_lamp: row.carcasInnerOuterLamp,
        carcas_inner_outer_lamp_img: row.carcasInnerOuterLampImg,
        carcas_inner_lamp_outer_paint_veneer: row.carcasInnerLampOuterPaintVeneer,
        carcas_inner_lamp_outer_paint_veneer_img: row.carcasInnerLampOuterPaintVeneerImg,
        shutter_lam: row.shutterLam,
        shutter_lam_img: row.shutterLamImg,
        shutter_paint_veneer: row.shutterPaintVeneer,
        shutter_paint_veneer_img: row.shutterPaintVeneerImg,
        shutter_veneer_design: row.shutterVeneerDesign,
        shutter_veneer_design_img: row.shutterVeneerDesignImg,
        shutter_come_moulding: row.shutterComeMoudding,
        shutter_come_moulding_img: row.shutterComeMouddingImg,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('estimation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("Data successfully saved to Supabase!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data: " + error.message);
    }
  };

  const downloadPDF = async () => {
    const element = pdfContainerRef.current;
    // Hide buttons during capture
    const buttons = element.querySelectorAll('.btn, .clear-btn');
    buttons.forEach(b => b.style.display = 'none');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If height is more than one page, we could do multi-page, but for now let's scale to fit if it's close
      // or just add one page with the content.
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${siteName || 'estimation'}_report.pdf`);
    } finally {
      // Show buttons again
      buttons.forEach(b => b.style.display = '');
    }
  };

  const getChartData = () => {
    if (useManualChart) {
      return [
        { name: 'Regular (R)', value: Number(manualValues.R), color: '#d97706' },
        { name: 'Special (S)', value: Number(manualValues.S), color: '#ec4899' },
        { name: 'Super Special (SS)', value: Number(manualValues.SS), color: '#4f46e5' }
      ];
    }

    const counts = { R: 0, S: 0, SS: 0 };
    rows.forEach(row => {
      ['carcasInnerOuterLamp', 'carcasInnerLampOuterPaintVeneer', 'shutterLam', 'shutterPaintVeneer', 'shutterVeneerDesign', 'shutterComeMoudding'].forEach(field => {
        const val = row[field];
        if (val === 'R' || val === 'Regular') counts.R++;
        else if (val === 'S' || val === 'Special') counts.S++;
        else if (val === 'SS' || val === 'Super Special') counts.SS++;
      });
    });

    const total = counts.R + counts.S + counts.SS;
    if (total === 0) {
      return [
        { name: 'Regular (R)', value: 0, color: '#d97706' },
        { name: 'Special (S)', value: 0, color: '#ec4899' },
        { name: 'Super Special (SS)', value: 0, color: '#4f46e5' }
      ];
    }

    return [
      { name: 'Regular (R)', value: Number(((counts.R / total) * 100).toFixed(2)), count: counts.R, color: '#d97706' },
      { name: 'Special (S)', value: Number(((counts.S / total) * 100).toFixed(2)), count: counts.S, color: '#ec4899' },
      { name: 'Super Special (SS)', value: Number(((counts.SS / total) * 100).toFixed(2)), count: counts.SS, color: '#4f46e5' }
    ];
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

  const FileUpload = ({ label, currentUrl, setUrl, accept }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        setUrl(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file: ' + error.message);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{label.toUpperCase()}</label>
        <div style={{
          background: 'var(--bg-main)', border: '2px dashed var(--input-border)',
          borderRadius: '12px', padding: '20px', textAlign: 'center',
          transition: 'all 0.2s', position: 'relative'
        }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={accept} style={{ display: 'none' }} />

          {currentUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>✓ {label} Uploaded</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => fileInputRef.current.click()} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Change</button>
                <button onClick={() => setUrl(null)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem', color: '#ef4444', borderColor: '#ef4444' }}>Remove</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="btn btn-outline"
              style={{ width: '100%', borderStyle: 'none', background: 'transparent' }}
            >
              {uploading ? 'Uploading...' : `+ Add ${label}`}
            </button>
          )}
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
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        updateRow(rowId, `${field}Img`, publicUrl);
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
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button
          onClick={handleClick}
          className={`upload-field-btn ${!choiceSelected ? 'disabled' : ''}`}
          disabled={uploading}
          title={!choiceSelected ? "Select a choice first" : (uploading ? "Uploading..." : (currentImage ? "View Full Image" : "Upload Image"))}
          style={{
            background: !choiceSelected ? '#f1f5f9' : (uploading ? '#e2e8f0' : (currentImage ? 'var(--primary)' : '#f1f5f9')),
            border: 'none',
            borderRadius: '6px',
            padding: '6px',
            cursor: (!choiceSelected || uploading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            transition: 'all 0.2s',
            opacity: !choiceSelected ? 0.5 : 1
          }}
        >
          {uploading ? (
            <div className="spinner-small"></div>
          ) : currentImage ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={!choiceSelected ? "#cbd5e1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          )}
        </button>

        {currentImage && (
          <div className="img-preview-tooltip" onClick={() => setShowFullImage(true)} style={{ cursor: 'pointer' }}>
            <img src={currentImage} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>Click to expand</div>
          </div>
        )}

        {showFullImage && <ImageModal imageUrl={currentImage} onClose={() => setShowFullImage(false)} />}
      </div>
    );
  };

  const options = [
    { value: 'Regular', label: 'Regular' },
    { value: 'Special', label: 'Special' },
    { value: 'Super Special', label: 'Super Special' }
  ];

  const getCounts = () => {
    const counts = { R: 0, S: 0, SS: 0 };
    rows.forEach(row => {
      ['carcasInnerOuterLamp', 'carcasInnerLampOuterPaintVeneer', 'shutterLam', 'shutterPaintVeneer', 'shutterVeneerDesign', 'shutterComeMoudding'].forEach(field => {
        const val = row[field];
        if (val === 'R' || val === 'Regular') counts.R++;
        else if (val === 'S' || val === 'Special') counts.S++;
        else if (val === 'SS' || val === 'Super Special') counts.SS++;
      });
    });
    return counts;
  };

  const counts = getCounts();
  const chartData = getChartData();
  const totalItems = rows.length;

  return (
    <div className="estimation-wrapper" ref={pdfContainerRef} style={{ background: '#f8fafc', padding: '30px' }}>
      {/* 1. Header Info Section */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Estimation Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Professional interior design material report generator</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SITE NAME</label>
                <input type="text" placeholder="e.g. Skyline Residency" className="input-field" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CLIENT NAME</label>
                <input type="text" placeholder="e.g. John Doe" className="input-field" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PROJECT DATE</label>
                <input type="date" className="input-field" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>STATUS</label>
                <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)} style={{ fontWeight: 600 }}>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={downloadExcel} className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981', padding: '8px 16px', fontSize: '0.8rem' }}>Excel</button>
              <button onClick={downloadHistogram} className="btn btn-outline" style={{ borderColor: '#6366f1', color: '#6366f1', padding: '8px 16px', fontSize: '0.8rem' }}>Histogram</button>
              <button onClick={downloadPieChart} className="btn btn-outline" style={{ borderColor: '#ec4899', color: '#ec4899', padding: '8px 16px', fontSize: '0.8rem' }}>Pie Chart</button>
              <button onClick={downloadPDF} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>PDF Report</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ background: '#3b82f6', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)', padding: '8px 16px', fontSize: '0.8rem' }}>Save to Supabase</button>
            </div>
          </div>
        </div>

        {/* 2. Attachments Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--input-border)' }}>
          <FileUpload label="Floor Plan" currentUrl={floorPlanUrl} setUrl={setFloorPlanUrl} accept="image/*,application/pdf" />
          <FileUpload label="Site Photo" currentUrl={sitePhotoUrl} setUrl={setSitePhotoUrl} accept="image/*" />
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              Upload floor plans or site photos to keep them linked with this estimation.
            </p>
          </div>
        </div>

        {/* 3. Stats Cards Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Items</p>
            <h4 style={{ fontSize: '1.5rem', color: '#1e293b' }}>{totalItems}</h4>
          </div>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: `1px solid #d9770633`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Regular (R)</p>
            <h4 style={{ fontSize: '1.5rem', color: '#d97706' }}>{counts.R}</h4>
          </div>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: `1px solid #ec489933`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Special (S)</p>
            <h4 style={{ fontSize: '1.5rem', color: '#ec4899' }}>{counts.S}</h4>
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Super Special (SS)</p>
            <h4 style={{ fontSize: '1.5rem', color: '#4f46e5' }}>{counts.SS}</h4>
          </div>
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><input type="text" placeholder="e.g. TV Unit" className="input-field" value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} /></td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={row.carcasInnerOuterLamp} onChange={(e) => updateRow(row.id, 'carcasInnerOuterLamp', e.target.value)}>
                        <option value="">Choice...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ImageUpload rowId={row.id} field="carcasInnerOuterLamp" currentImage={row.carcasInnerOuterLampImg} choiceSelected={!!row.carcasInnerOuterLamp} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={row.carcasInnerLampOuterPaintVeneer} onChange={(e) => updateRow(row.id, 'carcasInnerLampOuterPaintVeneer', e.target.value)}>
                        <option value="">Choice...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ImageUpload rowId={row.id} field="carcasInnerLampOuterPaintVeneer" currentImage={row.carcasInnerLampOuterPaintVeneerImg} choiceSelected={!!row.carcasInnerLampOuterPaintVeneer} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={row.shutterLam} onChange={(e) => updateRow(row.id, 'shutterLam', e.target.value)}>
                        <option value="">Choice...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ImageUpload rowId={row.id} field="shutterLam" currentImage={row.shutterLamImg} choiceSelected={!!row.shutterLam} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={row.shutterPaintVeneer} onChange={(e) => updateRow(row.id, 'shutterPaintVeneer', e.target.value)}>
                        <option value="">Choice...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ImageUpload rowId={row.id} field="shutterPaintVeneer" currentImage={row.shutterPaintVeneerImg} choiceSelected={!!row.shutterPaintVeneer} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={row.shutterVeneerDesign} onChange={(e) => updateRow(row.id, 'shutterVeneerDesign', e.target.value)}>
                        <option value="">Choice...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ImageUpload rowId={row.id} field="shutterVeneerDesign" currentImage={row.shutterVeneerDesignImg} choiceSelected={!!row.shutterVeneerDesign} />
                    </div>
                  </td>
                  <td>
                    <div className="choice-cell">
                      <select className="input-field" value={row.shutterComeMoudding} onChange={(e) => updateRow(row.id, 'shutterComeMoudding', e.target.value)}>
                        <option value="">Choice...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ImageUpload rowId={row.id} field="shutterComeMoudding" currentImage={row.shutterComeMouddingImg} choiceSelected={!!row.shutterComeMoudding} />
                    </div>
                  </td>
                  <td>{rows.length > 1 && (<button onClick={() => removeRow(row.id)} className="delete-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button onClick={addRow} className="btn btn-outline" style={{ width: '100%', maxWidth: '200px' }}>+ Add New Item</button>
        </div>
      </div>

      {/* Chart Configuration Section */}
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
              onChange={(e) => setManualValues({ ...manualValues, R: e.target.value })}
              min="0" max="100"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ec4899', display: 'block', marginBottom: '4px' }}>SPECIAL %</label>
            <input
              type="number"
              className="input-field"
              value={manualValues.S}
              onChange={(e) => setManualValues({ ...manualValues, S: e.target.value })}
              min="0" max="100"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', display: 'block', marginBottom: '4px' }}>SUPER SPECIAL %</label>
            <input
              type="number"
              className="input-field"
              value={manualValues.SS}
              onChange={(e) => setManualValues({ ...manualValues, SS: e.target.value })}
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

      {/* 4. Visualizations Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Histogram */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div ref={chartRef} style={{ background: 'white', padding: '2.5rem', position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', top: '15px', right: '20px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>Material Legend</div>
              {chartData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.name}</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: item.color }}></div>
                </div>
              ))}
            </div>
            <h3 style={{ marginBottom: '2rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Material Distribution</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value, name, props) => props?.payload ? [`Count: ${props.payload.count}`, `${name}: ${value}%`] : [`${name}: ${value}%`]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    <LabelList dataKey="value" position="top" style={{ fill: '#1e293b', fontWeight: 800, fontSize: '12px' }} formatter={(val, entry) => entry?.payload ? `${entry.payload.count} (${val}%)` : `${val}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {siteName && (
              <div style={{ position: 'absolute', bottom: '15px', right: '20px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SITE NAME</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{siteName}</div>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card" style={{ padding: '2.5rem', background: 'white', position: 'relative' }}>
          <div ref={pieChartRef} style={{ background: 'white', padding: '1rem', position: 'relative' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.25rem', textAlign: 'center' }}>Material Percentage</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {siteName && (
              <div style={{ position: 'absolute', bottom: '15px', right: '20px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SITE NAME</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{siteName}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '1rem', fontSize: '0.8rem' }}>
        <p>© 2026 Estimation Pro Dashboard. Professional Reporting Tool.</p>
      </footer>
    </div>
  );
};

export default EstimationForm;
