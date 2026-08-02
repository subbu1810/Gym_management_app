import React, { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiTrash2, FiDownload, FiRefreshCw, FiSearch, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { logsAPI } from '../../../services/api';

const SystemLogsSettings = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [limit, setLimit] = useState(100);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logsAPI.getAll({
        search: searchTerm,
        level: levelFilter,
        limit: limit
      });
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, levelFilter, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all system logs? This cannot be undone.')) {
      return;
    }
    setClearing(true);
    try {
      const res = await logsAPI.clear();
      if (res.success) {
        toast.success(res.message || 'System logs cleared');
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  const getLevelBadgeStyle = (level) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
      case 'CRITICAL':
      case 'ALERT':
      case 'EMERGENCY':
        return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' };
      case 'WARNING':
        return { background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' };
      case 'INFO':
        return { background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe' };
      case 'DEBUG':
      default:
        return { background: '#f5f5f4', color: '#57534e', border: '1px solid #e7e5e4' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Top Filter Controls Card */}
      <div className="chart-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              <FiFileText />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>System Error & Application Logs</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Monitor background tasks, debug statements, database failures, and general application performance.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a 
              href={logsAPI.downloadUrl()} 
              target="_blank"
              rel="noreferrer"
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}
            >
              <FiDownload /> Download Logs
            </a>

            <button 
              onClick={handleClearLogs}
              disabled={clearing}
              style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecdcd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}
            >
              <FiTrash2 /> Clear Logs
            </button>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        {/* Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search in log message content..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <select 
              value={levelFilter} 
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.8rem', color: '#475569' }}
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          <div>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.8rem', color: '#475569' }}
            >
              <option value={50}>Last 50 logs</option>
              <option value={100}>Last 100 logs</option>
              <option value={200}>Last 200 logs</option>
              <option value={500}>Last 500 logs</option>
            </select>
          </div>

          <button 
            onClick={fetchLogs}
            disabled={loading}
            style={{ width: '100%', padding: '8px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Reload
          </button>
        </div>
      </div>

      {/* Logs Details List Table */}
      <div className="chart-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Parsing and rendering system log entries...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
            <FiFileText size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No log entries matching filters</div>
            <div style={{ fontSize: '0.75rem' }}>Select other log levels or adjust your search filter query.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', width: '150px' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', width: '100px', textAlign: 'center' }}>Level</th>
                  <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0' }}>Log Message Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#475569', whiteSpace: 'nowrap' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '700',
                        ...getLevelBadgeStyle(log.level)
                      }}>
                        {log.level}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', border: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default SystemLogsSettings;
