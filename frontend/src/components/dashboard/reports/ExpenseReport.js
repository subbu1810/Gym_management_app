import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDollarSign, FiTag, FiCalendar, FiCreditCard, FiDownload, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { expensesAPI } from '../../../services/api';

const CATEGORY_COLORS = {
  'Rent':                             '#3b82f6',
  'Electricity':                      '#f59e0b',
  'Water':                            '#06b6d4',
  'Staff Salary':                     '#10b981',
  'Trainer Salary':                   '#14b8a6',
  'Equipment Purchase':               '#ef4444',
  'Equipment Maintenance':            '#f43f5e',
  'Cleaning & Housekeeping':          '#84cc16',
  'Internet / Wi-Fi':                 '#0ea5e9',
  'Software / Subscriptions':         '#8b5cf6',
  'Marketing & Advertising':          '#ec4899',
  'Supplements / Inventory Purchase': '#f97316',
  'Repairs & Maintenance':            '#a855f7',
  'Office Supplies':                  '#eab308',
  'Taxes / Licenses':                 '#374151',
  'Miscellaneous':                    '#6b7280',
  'Others':                           '#94a3b8',
};

const STATUS_CONFIG = {
  Paid:             { color: '#16a34a', bg: '#dcfce7' },
  Pending:          { color: '#d97706', bg: '#fef3c7' },
  'Partially Paid': { color: '#2563eb', bg: '#dbeafe' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#475569', bg: '#f1f5f9' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {status || '—'}
    </span>
  );
};

const ExpenseReport = () => {
  const [data, setData]             = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [lastPage, setLastPage]     = useState(1);

  const [filters, setFilters] = useState({ category: '', date_from: '', date_to: '', search: '' });
  const [applied, setApplied] = useState({ category: '', date_from: '', date_to: '', search: '' });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expensesAPI.getAll({ ...applied, page });
      if (res.success) {
        setData(res.data);
        setTotal(res.total);
        setLastPage(res.lastPage);
        setTotalAmount(res.total_amount);
        setCategorySummary(res.category_summary || []);
      }
    } catch (e) {
      console.error('Failed to fetch expense report:', e);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleApply = () => { setApplied({ ...filters }); setPage(1); };
  const handleClear = () => { setFilters({ category: '', date_from: '', date_to: '', search: '' }); setApplied({ category: '', date_from: '', date_to: '', search: '' }); setPage(1); };

  const pieData = categorySummary.map(c => ({
    name: c.category,
    value: parseFloat(c.total || 0),
    color: CATEGORY_COLORS[c.category] || '#6b7280'
  })).filter(d => d.value > 0);

  // --- Exports ---
  const exportCSV = () => {
    const headers = ['#', 'Expense Name', 'Category', 'Date', 'Amount (INR)', 'Vendor', 'Method', 'Status', 'Bill Ref'];
    const lines   = data.map((r, i) => [
      i + 1,
      `"${r.title || ''}"`,
      r.category || '',
      r.date || '',
      r.amount || 0,
      `"${r.paid_to || ''}"`,
      r.payment_method || '',
      r.payment_status || '',
      `"${r.reference_no || ''}"`
    ].join(','));
    const csv  = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `expense_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const tableRows = data.map((r, i) => `
      <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${i+1}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:600">${r.title||''}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.category||''}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${r.date||''}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;text-align:right">₹${parseFloat(r.amount||0).toFixed(2)}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.paid_to||'—'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${r.payment_method||'—'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0"><span style="background:${STATUS_CONFIG[r.payment_status]?.bg||'#f1f5f9'};color:${STATUS_CONFIG[r.payment_status]?.color||'#475569'};padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:600">${r.payment_status||''}</span></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><title>Expense Analysis Report</title>
      <style>body{font-family:sans-serif;padding:24px;color:#0f172a}h2{color:#dc2626;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;border:1px solid #e2e8f0;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px;color:#475569}@media print{button{display:none}}</style>
      </head><body>
      <h2>Expense Analysis Report</h2>
      <p style="color:#64748b;font-size:12px;margin-bottom:12px">Exported on ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>#</th><th>Expense Title</th><th>Category</th><th>Date</th><th>Amount</th><th>Vendor</th><th>Method</th><th>Status</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
      <script>window.onload=()=>{window.print();}<\/script></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const statCards = [
    { label: 'Total Expenditures', count: `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#dc2626', bg: '#fee2e2', icon: <FiDollarSign /> },
    { label: 'Transactions',      count: total, color: '#0f172a', bg: '#f8fafc', icon: <FiFileText /> },
    { label: 'Expense Categories', count: pieData.length, color: '#2563eb', bg: '#dbeafe', icon: <FiTag /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {statCards.map(c => (
          <div key={c.label} style={{ background: '#fff', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>{c.count}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Search expense name, description, reference..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">All Categories</option>
          {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
        />

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
        {/* Category Breakdown Bar Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Expenditure by Category</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            {pieData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category share Pie */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Share Percentage</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {pieData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No share breakdown available</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={52}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontWeight: '500', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Read-only Ledger table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Expense Transactions <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>({total} records)</span>
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
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>Loading report data…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>No expense records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0' }}>Expense Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '120px' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '100px' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '100px' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '110px' }}>Paid To</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '90px' }}>Method</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '90px' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '150px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={r.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '7px 12px', color: '#94a3b8', border: '1px solid #e2e8f0', textAlign: 'center' }}>{(page-1)*15+idx+1}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{r.title}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', background: `${CATEGORY_COLORS[r.category]}1a` || '#f1f5f9', color: CATEGORY_COLORS[r.category] || '#475569', fontSize: '0.7rem', fontWeight: '600' }}>
                      {r.category}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px', color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '7px 12px', color: '#dc2626', border: '1px solid #e2e8f0', fontWeight: '700' }}>₹{parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '7px 12px', color: '#475569', border: '1px solid #e2e8f0' }}>{r.paid_to || '—'}</td>
                  <td style={{ padding: '7px 12px', color: '#475569', border: '1px solid #e2e8f0' }}>{r.payment_method || '—'}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}><StatusBadge status={r.payment_status} /></td>
                  <td style={{ padding: '7px 12px', color: '#64748b', border: '1px solid #e2e8f0' }}>{r.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExpenseReport;
