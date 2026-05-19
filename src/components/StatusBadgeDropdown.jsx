import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StatusBadgeDropdown = ({ project, onStatusUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState(project.remark || '');
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsEditingRemark(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus, customRemark = '') => {
    setUpdating(true);
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'Remark') {
        updateData.remark = customRemark || remarkText;
      } else {
        updateData.remark = null;
      }

      const { error } = await supabase
        .from('estimations')
        .update(updateData)
        .eq('id', project.id);

      if (error) throw error;
      
      if (onStatusUpdated) {
        onStatusUpdated(project.id, newStatus, updateData.remark);
      }
      setIsOpen(false);
      setIsEditingRemark(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const statusClass = (project.status || 'Drawing Approved').toLowerCase().replace(' ', '-');
  const displayText = project.status === 'Remark' ? (project.remark || 'Remark') : (project.status || 'Drawing Approved');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`badge badge-${statusClass}`}
        style={{
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '0.7rem',
          fontWeight: 700,
          transition: 'transform 0.2s',
          outline: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        disabled={updating}
      >
        {displayText}
        <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'var(--card-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          minWidth: '180px',
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          {!isEditingRemark ? (
            <>
              {['Drawing Approved', 'Running Project', 'Remark', 'Completed'].map((opt) => (
                <button
                  key={opt}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (opt === 'Remark') {
                      setIsEditingRemark(true);
                    } else {
                      handleStatusChange(opt);
                    }
                  }}
                  style={{
                    background: project.status === opt ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    color: project.status === opt ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: project.status === opt ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = project.status === opt ? 'rgba(37, 99, 235, 0.08)' : 'transparent'}
                >
                  {opt}
                  {project.status === opt && <span style={{ color: 'var(--primary)' }}>✓</span>}
                </button>
              ))}
            </>
          ) : (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>ENTER REMARK:</div>
              <input
                type="text"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Custom remark..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditingRemark(false)}
                  style={{ background: 'transparent', border: 'none', padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  Back
                </button>
                <button
                  onClick={() => handleStatusChange('Remark')}
                  style={{ background: 'var(--primary)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusBadgeDropdown;
