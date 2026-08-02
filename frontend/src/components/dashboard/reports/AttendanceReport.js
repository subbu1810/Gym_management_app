import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiUsers, FiCheckCircle, FiXCircle, FiClock, FiChevronLeft, FiChevronRight, FiDownload, FiFileText, FiCalendar } from 'react-icons/fi';
import { adminAPI } from '../../../services/api';

const STATUS_CONFIG = {
  Present:  { color: '#16a34a', bg: '#dcfce7' },
  Absent:   { color: '#dc2626', bg: '#fee2e2' },
  Late:     { color: '#d97706', bg: '#fef3c7' },
  'Half Day': { color: '#2563eb', bg: '#dbeafe' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#475569', bg: '#f1f5f9' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {status || '—'}
    </span>
  );
};

const fmt12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`;
};

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AttendanceReport = () => {
  const todayStr = getTodayDateString();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', date_from: todayStr, date_to: todayStr, search: '' });
  const [applied, setApplied] = useState({ status: '', date_from: todayStr, date_to: todayStr, search: '' });
  const [page, setPage]       = useState(1);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.getAttendanceReport({ ...params, page });
      if (res.success) setData(res.data);
    } catch (e) {
      console.error('AttendanceReport fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(applied); }, [fetchData, applied, page]);

  const handleApply = () => { setApplied({ ...filters }); setPage(1); };
  const handleClear = () => {
    const todayStr = getTodayDateString();
    setFilters({ status: '', date_from: todayStr, date_to: todayStr, search: '' });
    setPage(1);
    setApplied({ status: '', date_from: todayStr, date_to: todayStr, search: '' });
  };

  // --- Exports ---
  const exportCSV = async () => {
    try {
      const res  = await adminAPI.getAttendanceReport({ ...applied, per_page: 9999 });
      const rows = res?.data?.records || [];
      const headers = ['#', 'Name', 'Email', 'Date', 'Check In', 'Check Out', 'Status', 'Method'];
      const lines   = rows.map((r, i) => [
        i + 1,
        `"${r.full_name || ''}"`,
        `"${r.user_email || ''}"`,
        r.date || '',
        fmt12(r.check_in_time),
        fmt12(r.check_out_time),
        r.status || '',
        r.method || ''
      ].join(','));
      const csv  = [headers.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `attendance_report_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('CSV export failed:', e); }
  };

  const exportPDF = async () => {
    try {
      const res      = await adminAPI.getAttendanceReport({ ...applied, per_page: 9999 });
      const rows     = res?.data?.records || [];
      const tableRows = rows.map((r, i) => `
        <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
          <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${i+1}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.full_name||''}<br/><small style="color:#94a3b8">${r.user_email||''}</small></td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.date||''}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${fmt12(r.check_in_time)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${fmt12(r.check_out_time)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0"><span style="background:${STATUS_CONFIG[r.status]?.bg||'#f1f5f9'};color:${STATUS_CONFIG[r.status]?.color||'#475569'};padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:600">${r.status||''}</span></td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.method||''}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html><head><title>Attendance Report</title>
        <style>body{font-family:sans-serif;padding:24px;color:#0f172a}h2{color:#dc2626;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;border:1px solid #e2e8f0;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px;color:#475569}@media print{button{display:none}}</style>
        </head><body>
        <h2>Attendance Report</h2>
        <p style="color:#64748b;font-size:12px;margin-bottom:12px">Exported on ${new Date().toLocaleDateString()}</p>
        <table><thead><tr><th>#</th><th>Name</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Method</th></tr></thead>
        <tbody>${tableRows}</tbody></table>
        <script>window.onload=()=>{window.print();}<\/script></body></html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
    } catch (e) { console.error('PDF export failed:', e); }
  };

  const records  = data?.records  || [];
  const summary  = data?.summary  || {};
  const total    = data?.total    || 0;
  const lastPage = data?.lastPage || 1;

  const statCards = [
    { label: 'Total',    count: total,                    color: '#0f172a', bg: '#f8fafc', icon: <FiUsers /> },
    { label: 'Present',  count: summary['Present']  || 0, color: '#16a34a', bg: '#dcfce7', icon: <FiCheckCircle /> },
    { label: 'Absent',   count: summary['Absent']   || 0, color: '#dc2626', bg: '#fee2e2', icon: <FiXCircle /> },
    { label: 'Late',     count: summary['Late']     || 0, color: '#d97706', bg: '#fef3c7', icon: <FiClock /> },
    { label: 'Half Day', count: summary['Half Day'] || 0, color: '#2563eb', bg: '#dbeafe', icon: <FiCalendar /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {statCards.map(c => (
          <div key={c.label}
            onClick={() => { setFilters(f => ({ ...f, status: c.label === 'Total' ? '' : c.label })); setApplied(a => ({ ...a, status: c.label === 'Total' ? '' : c.label })); setPage(1); }}
            style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${(applied.status || '') === (c.label === 'Total' ? '' : c.label) ? c.color : '#e5e7eb'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>{c.count}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Search name or email…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Date From */}
        <input
          type="date"
          value={filters.date_from}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        />

        {/* Date To */}
        <input
          type="date"
          value={filters.date_to}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        />

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        <button onClick={handleApply}
          style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiFilter size={12} /> Apply
        </button>

        <button onClick={handleClear}
          style={{ padding: '7px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Clear
        </button>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        <button onClick={exportCSV} title="Export as CSV"
          style={{ padding: '7px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiDownload size={12} /> CSV
        </button>

        <button onClick={exportPDF} title="Export as PDF"
          style={{ padding: '7px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiFileText size={12} /> PDF
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Attendance <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>({total} records)</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Page {page} of {lastPage}</span>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page===1?'#f8fafc':'#fff', color: page===1?'#cbd5e1':'#374151', cursor: page===1?'not-allowed':'pointer', display:'flex',alignItems:'center' }}>
              <FiChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page===lastPage?'#f8fafc':'#fff', color: page===lastPage?'#cbd5e1':'#374151', cursor: page===lastPage?'not-allowed':'pointer', display:'flex',alignItems:'center' }}>
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>Loading attendance…</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>No attendance records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Check In</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Check Out</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Method</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.id}
                  style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff7f7'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                >
                  <td style={{ padding: '7px 12px', color: '#94a3b8', fontWeight: '500', fontSize: '0.8rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>{(page-1)*15+idx+1}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.7rem', flexShrink: 0 }}>
                        {(r.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.82rem' }}>{r.full_name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{r.user_email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{fmt12(r.check_in_time)}</td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{fmt12(r.check_out_time)}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{r.method || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
