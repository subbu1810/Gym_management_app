import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDollarSign, FiTag, FiCalendar, FiDownload, FiFileText, FiChevronLeft, FiChevronRight, FiBox, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { inventoryAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#f97316', '#a855f7', '#06b6d4', '#84cc16', '#6b7280'
];

const SalesReport = () => {
  const [data, setData] = useState([]);
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category_id: '', date_from: '', date_to: '', search: '' });
  const [applied, setApplied] = useState({ category_id: '', date_from: '', date_to: '', search: '' });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await inventoryAPI.getCategories();
      if (res.success) setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getSalesReport({ ...applied, page });
      if (res.success) {
        setData(res.data);
        setTotal(res.total);
        setLastPage(res.lastPage);
        setTotalSalesValue(res.total_sales_value);
        setTotalSalesCount(res.total_sales_count);
        setCategorySummary(res.category_summary || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchSalesReport();
  }, [fetchSalesReport]);

  const handleApply = () => { setApplied({ ...filters }); setPage(1); };
  const handleClear = () => { setFilters({ category_id: '', date_from: '', date_to: '', search: '' }); setApplied({ category_id: '', date_from: '', date_to: '', search: '' }); setPage(1); };

  const chartData = categorySummary.map((c, i) => ({
    name: c.category_name || 'Uncategorized',
    value: parseFloat(c.total || 0),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  })).filter(d => d.value > 0);

  // Exports
  const exportCSV = () => {
    const headers = ['#', 'Date & Time', 'Item Name', 'SKU', 'Category', 'Quantity', 'Unit Selling Price', 'Total Sales Amount', 'Bill Ref'];
    const lines = data.map((r, i) => [
      i + 1,
      r.date || '',
      `"${r.item_name}"`,
      r.item_sku,
      r.category_name || '—',
      r.quantity,
      r.unit_selling_price,
      r.total_amount,
      `"${r.reference || ''}"`
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const rows = data.map((r, i) => `
      <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${i+1}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${r.date}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600">${r.item_name} (${r.item_sku})</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${r.category_name || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${r.quantity}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">₹${parseFloat(r.unit_selling_price).toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-weight:700">₹${parseFloat(r.total_amount).toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${r.reference || '—'}</td>
      </tr>
    `).join('');

    const html = `<html><head><title>Product Sales Report</title>
      <style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #e2e8f0;padding:6px 10px;font-size:12px}th{background:#f1f5f9;text-align:left}</style>
      </head><body>
      <h2>Product Sales Revenue Report</h2>
      <p style="color:#64748b;font-size:12px">Generated on ${new Date().toLocaleDateString()} | Total Revenue: ₹${totalSalesValue.toLocaleString()}</p>
      <table><thead><tr><th>#</th><th>Date</th><th>Product</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Total Sales</th><th>Ref Invoice</th></tr></thead>
      <tbody>${rows}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiTrendingUp />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>₹{totalSalesValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>Sales Revenue</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiBox />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{totalSalesCount} units</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>Product Volume Sold</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiTag />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{chartData.length} Categories</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>Active Sales Sectors</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Search item name or SKU..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={filters.category_id}
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
          style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
        />

        <button onClick={handleApply}
          style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
          Apply
        </button>

        <button onClick={handleClear}
          style={{ padding: '7px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer' }}>
          Clear
        </button>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', flexShrink: 0 }} />

        <button onClick={exportCSV} title="Export as CSV"
          style={{ padding: '7px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FiDownload size={12} /> CSV
        </button>

        <button onClick={exportPDF} title="Export as PDF"
          style={{ padding: '7px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FiFileText size={12} /> PDF
        </button>
      </div>

      {/* Analytics Visuals */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '14px', height: '240px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Revenue Share by Category</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={26}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '14px', height: '240px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Percentage share %</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {chartData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No data</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                <div style={{ width: '110px', height: '110px', position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={48}
                        paddingAngle={3}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, maxHeight: '180px', overflowY: 'auto' }}>
                  {chartData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontWeight: '500', color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75px' }}>{d.name}</span>
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

      {/* Transactions Details Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Sales Ledger Details <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>({total} sales)</span>
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
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading sales log…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No product sales recorded.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '110px' }}>Date</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Product Name</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '120px' }}>Category</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '80px' }}>Quantity</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '110px' }}>Unit Price</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '110px' }}>Total Amount</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', width: '120px' }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={r.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '7px 12px', color: '#94a3b8', border: '1px solid #e2e8f0', textAlign: 'center' }}>{(page-1)*15+idx+1}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>
                    <div>{r.item_name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.item_sku}</div>
                  </td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#dbeafe', color: '#2563eb', fontSize: '0.7rem', fontWeight: '600' }}>
                      {r.category_name || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>{r.quantity}</td>
                  <td style={{ padding: '7px 12px', color: '#475569', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{parseFloat(r.unit_selling_price || 0).toFixed(2)}</td>
                  <td style={{ padding: '7px 12px', color: '#16a34a', border: '1px solid #e2e8f0', fontWeight: '700', textAlign: 'right' }}>₹{parseFloat(r.total_amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '7px 12px', color: '#64748b', border: '1px solid #e2e8f0' }}>{r.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default SalesReport;
