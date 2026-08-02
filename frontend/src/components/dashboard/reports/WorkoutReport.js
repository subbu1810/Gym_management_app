import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiActivity, FiClock, FiTrendingUp, FiLayers, FiDownload, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { adminAPI } from '../../../services/api';

const LEVEL_COLORS = {
  Beginner:     { color: '#16a34a', bg: '#dcfce7', chart: '#22c55e' },
  Intermediate: { color: '#2563eb', bg: '#dbeafe', chart: '#3b82f6' },
  Advanced:     { color: '#dc2626', bg: '#fee2e2', chart: '#ef4444' },
};

const LevelBadge = ({ level }) => {
  const cfg = LEVEL_COLORS[level] || { color: '#475569', bg: '#f1f5f9' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {level || '—'}
    </span>
  );
};

const WorkoutReport = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ level: '', search: '' });
  const [applied, setApplied] = useState({ level: '', search: '' });
  const [page, setPage]       = useState(1);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.getWorkoutReport(params);
      if (res.success) setData(res.data);
    } catch (e) {
      console.error('WorkoutReport fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(applied);
  }, [fetchData, applied]);

  const handleApply = () => { setApplied({ ...filters }); setPage(1); };
  const handleClear = () => { setFilters({ level: '', search: '' }); setApplied({ level: '', search: '' }); setPage(1); };

  const records  = data?.records  || [];
  const summary  = data?.summary  || {};
  const total    = data?.total    || 0;
  
  // Pagination (local page sizing)
  const itemsPerPage = 6;
  const lastPage = Math.ceil(total / itemsPerPage) || 1;
  const paginatedRecords = records.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const statCards = [
    { label: 'Total Workouts', count: summary.total || 0, color: '#0f172a', bg: '#f8fafc', icon: <FiActivity /> },
    { label: 'Avg Duration',   count: `${summary.avg_duration || 0}m`, color: '#d97706', bg: '#fef3c7', icon: <FiClock /> },
    { label: 'Beginner',       count: summary.Beginner || 0, color: '#16a34a', bg: '#dcfce7', icon: <FiLayers /> },
    { label: 'Intermediate',   count: summary.Intermediate || 0, color: '#2563eb', bg: '#dbeafe', icon: <FiLayers /> },
    { label: 'Advanced',       count: summary.Advanced || 0, color: '#dc2626', bg: '#fee2e2', icon: <FiLayers /> },
  ];

  // Pie chart data for level distribution
  const pieData = [
    { name: 'Beginner', value: summary.Beginner || 0, color: LEVEL_COLORS.Beginner.chart },
    { name: 'Intermediate', value: summary.Intermediate || 0, color: LEVEL_COLORS.Intermediate.chart },
    { name: 'Advanced', value: summary.Advanced || 0, color: LEVEL_COLORS.Advanced.chart },
  ].filter(d => d.value > 0);

  // --- Exports ---
  const exportCSV = () => {
    const headers = ['#', 'Workout Title', 'Difficulty Level', 'Duration (mins)', 'Estimated Members', 'Description'];
    const lines   = records.map((r, i) => [
      i + 1,
      `"${r.title || ''}"`,
      r.level || '',
      r.duration_minutes || 0,
      r.count || 0,
      `"${r.description || ''}"`
    ].join(','));
    const csv  = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `workout_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const tableRows = records.map((r, i) => `
      <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${i+1}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:600">${r.title||''}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0"><span style="background:${LEVEL_COLORS[r.level]?.bg||'#f1f5f9'};color:${LEVEL_COLORS[r.level]?.color||'#475569'};padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:600">${r.level||''}</span></td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${r.duration_minutes||0} mins</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${r.count||0}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">${r.description||''}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><title>Workout Popularity Report</title>
      <style>body{font-family:sans-serif;padding:24px;color:#0f172a}h2{color:#dc2626;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;border:1px solid #e2e8f0;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px;color:#475569}@media print{button{display:none}}</style>
      </head><body>
      <h2>Workout Popularity Report</h2>
      <p style="color:#64748b;font-size:12px;margin-bottom:12px">Exported on ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>#</th><th>Workout Title</th><th>Level</th><th>Duration</th><th>Members</th><th>Description</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
      <script>window.onload=()=>{window.print();}<\/script></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {statCards.map(c => (
          <div key={c.label}
            style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}
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

      {/* Filter panel */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Search workout name or description…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        <select
          value={filters.level}
          onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">All Difficulty Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

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

      {/* Visual Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>
        {/* Popularity Bar Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '280px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiTrendingUp style={{ color: '#dc2626' }} /> Workout Popularity (Estimated Active Members)
          </h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            {records.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={records.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: '500' }} width={120} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {records.map((r, i) => (
                      <Cell key={`cell-${i}`} fill={LEVEL_COLORS[r.level]?.chart || '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Level Distribution Pie Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '280px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Difficulty Level Share</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {pieData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No difficulty breakdown available</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
                <div style={{ width: '140px', height: '140px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontWeight: '500', color: '#475569' }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workouts Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Workout Routines <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>({total} matches)</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Page {page} of {lastPage}</span>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page===1?'#f8fafc':'#fff', color: page===1?'#cbd5e1':'#374151', cursor: page===1?'not-allowed':'pointer', display:'flex', alignItems:'center' }}>
              <FiChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page===lastPage?'#f8fafc':'#fff', color: page===lastPage?'#cbd5e1':'#374151', cursor: page===lastPage?'not-allowed':'pointer', display:'flex', alignItems:'center' }}>
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>Loading workouts…</div>
        ) : paginatedRecords.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>No workouts found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Workout Title</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '120px' }}>Level</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '120px' }}>Duration</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '120px' }}>Active Members</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((r, idx) => (
                <tr key={r.id}
                  style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff7f7'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                >
                  <td style={{ padding: '7px 12px', color: '#94a3b8', fontWeight: '500', fontSize: '0.8rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>{(page-1)*itemsPerPage+idx+1}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{r.title}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}><LevelBadge level={r.level} /></td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{r.duration_minutes} mins</td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0', fontWeight: '600' }}>{r.count}</td>
                  <td style={{ padding: '7px 12px', color: '#64748b', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{r.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WorkoutReport;
