import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDollarSign, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp, FiDownload, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { adminAPI } from '../../../services/api';

const STATUS_CONFIG = {
  Paid:     { color: '#16a34a', bg: '#dcfce7', label: 'Paid', chart: '#22c55e' },
  Pending:  { color: '#d97706', bg: '#fef3c7', label: 'Pending', chart: '#f59e0b' },
  Refunded: { color: '#dc2626', bg: '#fee2e2', label: 'Refunded', chart: '#ef4444' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#475569', bg: '#f1f5f9', label: status };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
};

const PaymentReport = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '', search: '' });
  const [applied, setApplied] = useState({ status: '', date_from: '', date_to: '', search: '' });
  const [page, setPage]       = useState(1);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.getPaymentReport({ ...params, page });
      if (res.success) setData(res.data);
    } catch (e) {
      console.error('PaymentReport fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData(applied);
  }, [fetchData, applied, page]);

  const handleApply = () => { setApplied({ ...filters }); setPage(1); };
  const handleClear = () => { setFilters({ status: '', date_from: '', date_to: '', search: '' }); setApplied({ status: '', date_from: '', date_to: '', search: '' }); setPage(1); };

  const records  = data?.records  || [];
  const summary  = data?.summary  || {};
  const total    = data?.total    || 0;
  const lastPage = data?.lastPage || 1;

  const statCards = [
    { label: 'Total Volume',  count: `₹${(summary.total_amount || 0).toLocaleString()}`, color: '#0f172a', bg: '#f8fafc', icon: <FiTrendingUp /> },
    { label: 'Total Paid',    count: `₹${(summary.Paid?.amount || 0).toLocaleString()}`, color: '#16a34a', bg: '#dcfce7', icon: <FiCheckCircle /> },
    { label: 'Total Pending', count: `₹${(summary.Pending?.amount || 0).toLocaleString()}`, color: '#d97706', bg: '#fef3c7', icon: <FiClock /> },
    { label: 'Total Refunded',count: `₹${(summary.Refunded?.amount || 0).toLocaleString()}`, color: '#dc2626', bg: '#fee2e2', icon: <FiXCircle /> },
  ];

  // Pie chart data for status distribution (by count)
  const pieData = [
    { name: 'Paid', value: summary.Paid?.count || 0, color: STATUS_CONFIG.Paid.chart },
    { name: 'Pending', value: summary.Pending?.count || 0, color: STATUS_CONFIG.Pending.chart },
    { name: 'Refunded', value: summary.Refunded?.count || 0, color: STATUS_CONFIG.Refunded.chart },
  ].filter(d => d.value > 0);

  // --- Exports ---
  const exportCSV = async () => {
    try {
      const res = await adminAPI.getPaymentReport({ ...applied, per_page: 9999 });
      const rows = res?.data?.records || [];
      const headers = ['#', 'Member Name', 'Plan Type', 'Transaction ID', 'Date', 'Amount (INR)', 'Status'];
      const lines = rows.map((r, i) => [
        i + 1,
        `"${r.member_name || 'Unknown'}"`,
        `"${r.plan_type || 'Monthly Plan'}"`,
        r.transaction_id || '',
        r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
        r.amount || 0,
        r.status || 'Pending'
      ].join(','));
      const csv = [headers.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `payments_report_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('CSV export failed:', e); }
  };

  const exportPDF = async () => {
    try {
      const res = await adminAPI.getPaymentReport({ ...applied, per_page: 9999 });
      const rows = res?.data?.records || [];
      const tableRows = rows.map((r, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.member_name || 'Unknown'}<br/><small style="color:#94a3b8">${r.member_email || ''}</small></td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.plan_type || 'Monthly Plan'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.transaction_id || '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;text-align:right">₹${parseFloat(r.amount || 0).toFixed(2)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0"><span style="background:${STATUS_CONFIG[r.status]?.bg || '#f1f5f9'};color:${STATUS_CONFIG[r.status]?.color || '#475569'};padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:600">${r.status || ''}</span></td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html><head><title>Payment Transactions Report</title>
        <style>body{font-family:sans-serif;padding:24px;color:#0f172a}h2{color:#dc2626;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;border:1px solid #e2e8f0;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px;color:#475569}@media print{button{display:none}}</style>
        </head><body>
        <h2>Payment Transactions Report</h2>
        <p style="color:#64748b;font-size:12px;margin-bottom:12px">Exported on ${new Date().toLocaleDateString()}</p>
        <table><thead><tr><th>#</th><th>Member Name</th><th>Plan</th><th>Transaction ID</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${tableRows}</tbody></table>
        <script>window.onload=()=>{window.print();}<\/script></body></html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
    } catch (e) { console.error('PDF export failed:', e); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {statCards.map(c => (
          <div key={c.label}
            style={{ background: '#fff', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>{c.count}</div>
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
            placeholder="Search member name, email or transaction ID…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Refunded">Refunded</option>
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

      {/* Visual Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>
        {/* Collection Bar Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Collection by Status (INR Volume)
          </h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            {records.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No transaction data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Paid', amount: summary.Paid?.amount || 0, color: STATUS_CONFIG.Paid.chart },
                  { name: 'Pending', amount: summary.Pending?.amount || 0, color: STATUS_CONFIG.Pending.chart },
                  { name: 'Refunded', amount: summary.Refunded?.amount || 0, color: STATUS_CONFIG.Refunded.chart }
                ]} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Volume']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                    <Cell fill={STATUS_CONFIG.Paid.chart} />
                    <Cell fill={STATUS_CONFIG.Pending.chart} />
                    <Cell fill={STATUS_CONFIG.Refunded.chart} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Transaction Volume Share</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {pieData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No transaction count breakdown available</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
                <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={58}
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
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{d.value} txn</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Transaction Records <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>({total} matches)</span>
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
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>Loading payments…</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>No payment records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Member</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Plan</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0' }}>Transaction ID</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '120px' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '100px' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid #e2e8f0', width: '100px' }}>Status</th>
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
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.82rem' }}>{r.member_name}</div>
                    {r.member_email && <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{r.member_email}</div>}
                  </td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{r.plan_type || 'Monthly Plan'}</td>
                  <td style={{ padding: '7px 12px', color: '#64748b', fontSize: '0.8rem', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{r.transaction_id || '—'}</td>
                  <td style={{ padding: '7px 12px', color: '#475569', fontSize: '0.8rem', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '7px 12px', color: '#0f172a', fontSize: '0.82rem', border: '1px solid #e2e8f0', fontWeight: '700' }}>₹{parseFloat(r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentReport;
