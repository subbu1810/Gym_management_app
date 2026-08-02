import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiUsers, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiChevronLeft, FiChevronRight, FiDownload, FiFileText } from 'react-icons/fi';
import { adminAPI } from '../../../services/api';

const STATUS_CONFIG = {
  Active:  { color: '#16a34a', bg: '#dcfce7', label: 'Active' },
  Expired: { color: '#dc2626', bg: '#fee2e2', label: 'Expired' },
  Paused:  { color: '#d97706', bg: '#fef3c7', label: 'Paused' },
  Trial:   { color: '#2563eb', bg: '#dbeafe', label: 'Trial' },
  Pending: { color: '#7c3aed', bg: '#ede9fe', label: 'Pending' },
};

const PLAN_COLORS = {
  'Monthly Plan':   '#dc2626',
  '3 Months Plan':  '#2563eb',
  '6 Months Plan':  '#16a34a',
  'Yearly Plan':    '#d97706',
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#475569', bg: '#f1f5f9', label: status };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
};

const PlanBadge = ({ plan }) => {
  const color = PLAN_COLORS[plan] || '#475569';
  return (
    <span style={{ color, fontWeight: '600', fontSize: '0.8rem' }}>{plan || '—'}</span>
  );
};

const MembershipReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', plan_type: '', search: '' });
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.getMembershipReport({ ...params, page });
      if (res.success) setData(res.data);
    } catch (e) {
      console.error('MembershipReport fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(applied); }, [applied, page]);

  const handleApplyFilters = () => {
    setPage(1);
    setApplied({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters({ status: '', plan_type: '', search: '' });
    setPage(1);
    setApplied({});
  };

  // --- Export Helpers ---
  const exportCSV = async () => {
    // Fetch all members with current filters (no pagination limit)
    try {
      const res = await adminAPI.getMembershipReport({ ...applied, per_page: 9999 });
      const rows = res?.data?.members || [];
      const headers = ['#', 'Name', 'Email', 'Phone', 'Plan', 'Status', 'Join Date', 'Slot'];
      const lines = rows.map((m, i) => [
        i + 1,
        `"${m.full_name || ''}"`  ,
        `"${m.email || ''}"`      ,
        `"${m.phone || ''}"`      ,
        `"${m.plan_type || ''}"`  ,
        m.status || '',
        m.join_date || '',
        m.gym_slot || ''
      ].join(','));
      const csv = [headers.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `membership_report_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('CSV export failed:', e); }
  };

  const exportPDF = async () => {
    try {
      const res = await adminAPI.getMembershipReport({ ...applied, per_page: 9999 });
      const rows = res?.data?.members || [];
      const tableRows = rows.map((m, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${m.full_name || ''}<br/><small style="color:#94a3b8">${m.email || ''}</small></td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${m.phone || ''}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:600">${m.plan_type || ''}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0"><span style="background:${STATUS_CONFIG[m.status]?.bg||'#f1f5f9'};color:${STATUS_CONFIG[m.status]?.color||'#475569'};padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:600">${m.status || ''}</span></td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${m.join_date || ''}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${m.gym_slot || ''}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html><head><title>Membership Report</title>
        <style>body{font-family:sans-serif;padding:24px;color:#0f172a}h2{color:#dc2626;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;border:1px solid #e2e8f0;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px;color:#475569}@media print{button{display:none}}</style>
        </head><body>
        <h2>Membership Report</h2>
        <p style="color:#64748b;font-size:12px;margin-bottom:12px">Exported on ${new Date().toLocaleDateString()}</p>
        <table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Plan</th><th>Status</th><th>Join Date</th><th>Slot</th></tr></thead>
        <tbody>${tableRows}</tbody></table>
        <script>window.onload=()=>{window.print();}<\/script></body></html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
    } catch (e) { console.error('PDF export failed:', e); }
  };

  const members = data?.members || [];
  const statusSummary = data?.statusSummary || {};
  const plans = data?.plans || [];
  const totalMembers = data?.totalMembers || 0;
  const lastPage = data?.lastPage || 1;

  const statCards = [
    { label: 'Total', count: totalMembers, color: '#0f172a', bg: '#f8fafc', icon: <FiUsers /> },
    { label: 'Active', count: statusSummary['Active']?.count || 0, color: '#16a34a', bg: '#dcfce7', icon: <FiCheckCircle /> },
    { label: 'Expired', count: statusSummary['Expired']?.count || 0, color: '#dc2626', bg: '#fee2e2', icon: <FiXCircle /> },
    { label: 'Paused', count: statusSummary['Paused']?.count || 0, color: '#d97706', bg: '#fef3c7', icon: <FiClock /> },
    { label: 'Trial', count: statusSummary['Trial']?.count || 0, color: '#2563eb', bg: '#dbeafe', icon: <FiAlertCircle /> },
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
            onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
            placeholder="Search name, email or phone…"
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

        {/* Plan filter */}
        <select
          value={filters.plan_type}
          onChange={e => setFilters(f => ({ ...f, plan_type: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">All Plans</option>
          {plans.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        {/* Apply */}
        <button onClick={handleApplyFilters}
          style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiFilter size={12} /> Apply
        </button>

        {/* Clear */}
        <button onClick={handleClearFilters}
          style={{ padding: '7px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Clear
        </button>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        {/* Export CSV */}
        <button onClick={exportCSV} title="Export as CSV"
          style={{ padding: '7px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiDownload size={12} /> CSV
        </button>

        {/* Export PDF */}
        <button onClick={exportPDF} title="Export as PDF"
          style={{ padding: '7px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiFileText size={12} /> PDF
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Members <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.85rem' }}>({totalMembers} results)</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Page {page} of {lastPage}</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Loading members…</div>
        ) : members.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No members found for the selected filters.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Phone</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Plan</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Join Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Slot</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => (
                <tr key={m.id}
                  style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff7f7'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                >
                  <td style={{ padding: '7px 12px', color: '#94a3b8', fontWeight: '500', fontSize: '0.8rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>{(page - 1) * 15 + idx + 1}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.7rem', flexShrink: 0 }}>
                        {(m.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.82rem' }}>{m.full_name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{m.phone}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}><PlanBadge plan={m.plan_type} /></td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}><StatusBadge status={m.status} /></td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{m.join_date ? new Date(m.join_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{m.gym_slot || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page <= 1 ? '#f8fafc' : '#fff', color: page <= 1 ? '#cbd5e1' : '#374151', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '500' }}
            >
              <FiChevronLeft /> Prev
            </button>
            {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e5e7eb', background: page === p ? '#dc2626' : '#fff', color: page === p ? '#fff' : '#374151', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= lastPage}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page >= lastPage ? '#f8fafc' : '#fff', color: page >= lastPage ? '#cbd5e1' : '#374151', cursor: page >= lastPage ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '500' }}
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default MembershipReport;
