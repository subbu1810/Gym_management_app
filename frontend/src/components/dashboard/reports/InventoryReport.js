import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDollarSign, FiTag, FiCalendar, FiCreditCard, FiDownload, FiFileText, FiChevronLeft, FiChevronRight, FiBox, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { inventoryAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGES = {
  'In Stock':      { color: '#16a34a', bg: '#dcfce7' },
  'Low Stock':     { color: '#d97706', bg: '#fef3c7' },
  'Out of Stock':  { color: '#dc2626', bg: '#fee2e2' },
  'Expiring Soon': { color: '#8b5cf6', bg: '#f3e8ff' },
  'Expired':       { color: '#7f1d1d', bg: '#fecaca' },
};

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#f97316', '#a855f7', '#06b6d4', '#84cc16', '#6b7280'
];

const InventoryReport = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, total_stock_value: 0, low_stock_items: 0, out_of_stock_items: 0, expiring_soon: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [reportType, setReportType] = useState('current_stock');
  const [branch, setBranch] = useState('');
  const [expiryStatus, setExpiryStatus] = useState('');

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await inventoryAPI.getDashboard();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getReports({ type: reportType, branch, expiry_status: expiryStatus });
      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [reportType, branch, expiryStatus]);

  useEffect(() => {
    fetchDashboardStats();
    fetchReportData();
  }, [fetchDashboardStats, fetchReportData]);

  // Aggregated charts data
  const getCategoryChartData = () => {
    const counts = {};
    data.forEach(item => {
      const cat = item.category?.name || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + (item.current_stock * item.purchase_price);
    });
    return Object.keys(counts).map((cat, i) => ({
      name: cat,
      value: counts[cat],
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    })).filter(c => c.value > 0);
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0) return 'Out of Stock';
    if (item.current_stock <= item.reorder_level) return 'Low Stock';
    if (item.expiry_date) {
      const expDate = new Date(item.expiry_date);
      const diffTime = expDate - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Expired';
      if (diffDays <= 30) return 'Expiring Soon';
    }
    return 'In Stock';
  };

  const catChartData = getCategoryChartData();

  // Exports
  const exportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Current Stock', 'Unit', 'Purchase Price (INR)', 'Selling Price (INR)', 'Stock Value (INR)', 'Expiry Date', 'Location', 'Branch'];
    const lines = data.map(r => [
      r.sku,
      `"${r.name}"`,
      r.category?.name || '—',
      r.current_stock,
      r.unit,
      r.purchase_price,
      r.selling_price || 0,
      r.current_stock * r.purchase_price,
      r.expiry_date || '—',
      `"${r.location || ''}"`,
      `"${r.branch || ''}"`
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${reportType}_report.csv`;
    a.click();
  };

  const exportPDF = () => {
    const rows = data.map((r, i) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${i+1}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600">${r.name} (${r.sku})</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${r.category?.name || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${r.current_stock} ${r.unit}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">₹${parseFloat(r.purchase_price).toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">₹${r.selling_price ? parseFloat(r.selling_price).toFixed(2) : '—'}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-weight:700">₹${(r.current_stock * r.purchase_price).toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${r.expiry_date || '—'}</td>
      </tr>
    `).join('');

    const html = `<html><head><title>Inventory Report</title>
      <style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #e2e8f0;padding:6px 10px;font-size:12px}th{background:#f1f5f9;text-align:left}</style>
      </head><body>
      <h2>Inventory Analytics Report - ${reportType.replace('_', ' ').toUpperCase()}</h2>
      <p style="color:#64748b;font-size:12px">Generated on ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>#</th><th>Item</th><th>Category</th><th>Stock</th><th>Purchase Price</th><th>Selling Price</th><th>Stock Value</th><th>Expiry Date</th></tr></thead>
      <tbody>${rows}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Analytics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FiDollarSign />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>₹{stats.total_stock_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Stock Valuation</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FiBox />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.total_items}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Item Types</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FiAlertTriangle />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.out_of_stock_items}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Out of Stock</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FiAlertCircle />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.low_stock_items}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Low Stock Items</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Report Type</label>
          <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb' }}>
            <option value="current_stock">Current Stock Report</option>
            <option value="low_stock">Low Stock Report</option>
            <option value="out_of_stock">Out of Stock Report</option>
            <option value="expiry">Expiry Tracking Report</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '150px' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Branch</label>
          <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="Filter Branch" style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb' }} />
        </div>

        {reportType === 'expiry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '150px' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Expiry Status</label>
            <select value={expiryStatus} onChange={e => setExpiryStatus(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb' }}>
              <option value="">All Expiries</option>
              <option value="Expired">Expired</option>
              <option value="Expiring Soon">Expiring Soon (30d)</option>
            </select>
          </div>
        )}

        <button onClick={fetchReportData} style={{ padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '14px' }}>Generate Report</button>
        <div style={{ width: '1px', height: '24px', background: '#e5e7eb', marginLeft: '8px', flexShrink: 0, marginTop: '14px' }} />

        <button onClick={exportCSV} disabled={data.length === 0} style={{ padding: '8px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiDownload /> CSV</button>
        <button onClick={exportPDF} disabled={data.length === 0} style={{ padding: '8px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiFileText /> PDF</button>
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>
        {/* Category breakdown bar chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '14px', height: '240px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Valuation by Category</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            {catChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catChartData}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={26}>
                    {catChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Share donut */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '14px', height: '240px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a', margin: '0 0 12px 0' }}>Share breakdown %</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {catChartData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No share breakdown</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                <div style={{ width: '110px', height: '110px', position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={48}
                        paddingAngle={3}
                      >
                        {catChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, maxHeight: '180px', overflowY: 'auto' }}>
                  {catChartData.map(d => (
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

      {/* Ledger details table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Generating data...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No items match the report criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>SKU</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Item Name</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Stock</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Purchase Cost</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Selling Price</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Total Value</th>
                <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '110px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const stat = getStockStatus(item);
                const badge = STATUS_BADGES[stat] || { color: '#475569', bg: '#f1f5f9' };
                return (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{item.sku}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{item.name}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0' }}>{item.category?.name || '—'}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>{item.current_stock} <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: '400' }}>{item.unit}</span></td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{parseFloat(item.purchase_price).toFixed(2)}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{item.selling_price ? `₹${parseFloat(item.selling_price).toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '700' }}>₹{(item.current_stock * item.purchase_price).toFixed(2)}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color, fontSize: '0.68rem', fontWeight: '700' }}>
                        {stat}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default InventoryReport;
