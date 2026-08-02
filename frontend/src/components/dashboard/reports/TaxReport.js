import React, { useState, useEffect } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { settingsAPI } from '../../../services/api';

const TaxReport = ({ displayPayments }) => {
  const [gymSettings, setGymSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsAPI.getSettings();
        if (res.success && res.data) {
          setGymSettings(res.data);
        }
      } catch (err) {
        console.error("Failed to load tax settings for report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px', background: '#fff', borderRadius: '12px' }}>Loading tax data...</div>;
  }

  const taxRate = parseFloat(gymSettings?.tax_rate || 0);
  const isInclusive = gymSettings?.tax_calculation_type === 'inclusive';
  const taxName = (gymSettings?.tax_name || 'GST').toUpperCase();
  const taxEnabled = gymSettings?.enable_tax === true || gymSettings?.enable_tax === 1 || gymSettings?.enable_tax === '1';

  // Process payments
  const processedData = (displayPayments || []).filter(p => (p.payment_status || p.p_status) === 'Paid').map(p => {
    const rawAmount = parseFloat(p.amount || p.p_amount || 0);
    
    let base = rawAmount;
    let tax = 0;
    let total = rawAmount;

    if (taxEnabled && taxRate > 0) {
      if (isInclusive) {
        base = rawAmount / (1 + taxRate / 100);
        tax = rawAmount - base;
        total = rawAmount;
      } else {
        base = rawAmount;
        tax = rawAmount * (taxRate / 100);
        total = rawAmount + tax;
      }
    }

    return {
      ...p,
      date: p.payment_date || p.created_at || new Date().toISOString(),
      rawAmount,
      base,
      tax,
      total,
      receiptNo: p.transaction_id || `TXN-${p.id}`
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalBase = processedData.reduce((sum, item) => sum + item.base, 0);
  const totalTax = processedData.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = processedData.reduce((sum, item) => sum + item.total, 0);

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Date,Receipt No,Member Name,Payment Method,Base Amount,${taxName} Amount,Total Amount\n`;
    
    processedData.forEach(row => {
      const dateStr = new Date(row.date).toLocaleDateString();
      const memberName = `"${(row.member_name || row.member?.name || 'Unknown').replace(/"/g, '""')}"`;
      const pMethod = `"${(row.method || row.payment_method || row.p_method || 'Manual').replace(/"/g, '""')}"`;
      csvContent += `${dateStr},${row.receiptNo},${memberName},${pMethod},${row.base.toFixed(2)},${row.tax.toFixed(2)},${row.total.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${taxName}_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiFileText style={{ color: '#4f46e5' }} /> Tax & GST Audit Report
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Detailed breakdown of Base Revenue and collected {taxName}. 
            ({taxEnabled ? `Active: ${taxRate}% ${isInclusive ? 'Inclusive' : 'Exclusive'}` : 'Tax Disabled'})
          </p>
        </div>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}>
          <FiDownload /> Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Total Base Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>₹{totalBase.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.8rem', color: '#1e40af', marginBottom: '4px' }}>Total {taxName} Collected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>₹{totalTax.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '4px' }}>Grand Total (Including Tax)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Receipt No</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Member</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Base Amt</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>{taxName}</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Total Amt</th>
            </tr>
          </thead>
          <tbody>
            {processedData.length > 0 ? (
              processedData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>{new Date(row.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{row.receiptNo}</td>
                  <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '500' }}>{row.member_name || row.member?.name || 'Unknown'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#334155' }}>₹{row.base.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#dc2626' }}>₹{row.tax.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>₹{row.total.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No paid transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaxReport;
