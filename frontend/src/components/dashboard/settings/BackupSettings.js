import React, { useState, useEffect } from 'react';
import { 
  FiDatabase, FiDownload, FiUpload, FiTrash2, FiRefreshCw, 
  FiAlertTriangle, FiCheckSquare, FiClock, FiFileText 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { backupAPI } from '../../../services/api';

const BackupSettings = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await backupAPI.getAll();
      if (res.success) {
        setBackups(res.backups);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to retrieve backup files');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const res = await backupAPI.create();
      if (res.success) {
        toast.success(res.message || 'Backup created successfully');
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to create database backup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = (backup) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;
    setActionLoading(true);
    setShowRestoreModal(false);
    try {
      const res = await backupAPI.restore(selectedBackup.filename);
      if (res.success) {
        toast.success(res.message || 'Database restored successfully!');
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to restore database');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete backup file: ${filename}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await backupAPI.delete(filename);
      if (res.success) {
        toast.success(res.message || 'Backup file deleted');
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete backup file');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sqlite')) {
      toast.error('Only .sqlite files can be uploaded');
      return;
    }

    const formData = new FormData();
    formData.append('backup_file', file);

    setActionLoading(true);
    try {
      const res = await backupAPI.upload(formData);
      if (res.success) {
        toast.success(res.message || 'Backup file uploaded successfully');
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to upload backup file');
    } finally {
      setActionLoading(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Header Controls */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              <FiDatabase />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Database Backup & Restore</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Create copies of your active database, download them locally, or restore a previous snapshot.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
              <FiUpload /> Upload Backup
              <input type="file" accept=".sqlite" onChange={handleUploadBackup} style={{ display: 'none' }} />
            </label>

            <button 
              onClick={handleCreateBackup}
              disabled={actionLoading}
              style={{ padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}
            >
              <FiRefreshCw className={actionLoading ? 'spin' : ''} /> Create Backup
            </button>
          </div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px', marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <FiAlertTriangle style={{ color: '#d97706', fontSize: '1.2rem', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#92400e', fontWeight: '700' }}>Critical Warning on Database Restore</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#b45309', lineHeight: '1.4' }}>
              Restoring a previous backup will overwrite all current member profiles, bookings, workout schedules, plan transactions, and configuration logs. 
              The system automatically creates a safety checkpoint of your database before performing any restore, so you can reverse changes if necessary.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Files List Table */}
      <div className="chart-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '0.9rem', marginTop: 0, marginBottom: '16px', color: '#0f172a' }}>Available Database Backups</h3>
        
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading backups...</div>
        ) : backups.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
            <FiDatabase size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No backups found</div>
            <div style={{ fontSize: '0.75rem' }}>Create a database snapshot or upload an existing sqlite file.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0' }}>Backup Filename</th>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', width: '120px' }}>File Size</th>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', width: '160px' }}>Created Date</th>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', width: '220px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>
                      {backup.filename.startsWith('safety_') ? (
                        <span style={{ color: '#b45309' }}>🛡️ {backup.filename} (Safety Checkpoint)</span>
                      ) : backup.filename.startsWith('uploaded_') ? (
                        <span style={{ color: '#2563eb' }}>📥 {backup.filename}</span>
                      ) : (
                        <span>💾 {backup.filename}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', color: '#475569' }}>
                      {formatBytes(backup.size)}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiClock size={12} style={{ color: '#94a3b8' }} /> {backup.created_at}
                      </div>
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <a 
                          href={backupAPI.downloadUrl(backup.filename)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '600' }}
                        >
                          <FiDownload size={12} /> Download
                        </a>
                        
                        <button 
                          onClick={() => handleRestoreBackup(backup)}
                          style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600' }}
                        >
                          <FiRefreshCw size={12} /> Restore
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteBackup(backup.filename)}
                          style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600' }}
                        >
                          <FiTrash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Restore Modal */}
      {showRestoreModal && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#dc2626' }}>
              <FiAlertTriangle size={24} />
              <h3 style={{ margin: 0 }}>Restore Database?</h3>
            </div>
            
            <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.85rem', lineHeight: '1.4' }}>
              Are you sure you want to restore the backup file <strong>{selectedBackup?.filename}</strong>? 
              This will overwrite all active profiles and statistics.
            </p>

            <p style={{ margin: '0 0 24px 0', color: '#b45309', fontSize: '0.78rem', background: '#fff7ed', padding: '10px', borderRadius: '8px', border: '1px solid #ffedd5' }}>
              ⚠️ A safety snapshot of your current database will be created before the restore completes.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowRestoreModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Cancel</button>
              <button onClick={confirmRestore} style={{ padding: '8px 16px', border: 'none', background: '#059669', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Confirm Restore</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BackupSettings;
