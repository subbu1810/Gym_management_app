import React, { useState, useEffect } from 'react';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiDownload, FiPlus, FiBarChart2, FiFilter, FiEye, FiMoreVertical, FiSearch, FiCreditCard, FiRefreshCw, FiEdit2, FiPrinter, FiX } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, CartesianGrid, XAxis, YAxis, Area, BarChart, Bar } from 'recharts';
import '../../styles/dashboard/PaymentsSection.css';
import { paymentsAPI, settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ExpiringSubscriptionsTable = ({ members, activeTab }) => {
  const getExpiryDate = (joinDateStr, planType) => {
    if (!joinDateStr) return null;
    const joinDate = new Date(joinDateStr);
    if (isNaN(joinDate)) return null;

    let monthsToAdd = 1;
    if (planType === '3 Months Plan') monthsToAdd = 3;
    else if (planType === '6 Months Plan') monthsToAdd = 6;
    else if (planType === 'Yearly Plan') monthsToAdd = 12;

    const expiryDate = new Date(joinDate);
    expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
    return expiryDate;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredMembers = members.filter(m => {
    const expiryDate = getExpiryDate(m.join_date, m.plan_type);
    if (!expiryDate) return false;

    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (activeTab === 'endingToday') {
      return diffDays === 0;
    } else if (activeTab === 'endingWeek') {
      return diffDays >= 0 && diffDays <= 7;
    } else if (activeTab === 'endingMonth') {
      return diffDays >= 0 && diffDays <= 30;
    }
    return false;
  }).sort((a, b) => getExpiryDate(a.join_date, a.plan_type) - getExpiryDate(b.join_date, b.plan_type));

  let title = "Expiring Today";
  if (activeTab === 'endingWeek') title = "Expiring Within 7 Days";
  if (activeTab === 'endingMonth') title = "Expiring Within 30 Days";

  return (
    <div className="list-card" style={{ padding: '0', overflowX: 'auto', marginBottom: '24px', marginTop: '-12px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>{title} ({filteredMembers.length})</h3>
        <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0 0 0' }}>Memberships that need to be renewed soon.</p>
      </div>
      <style>{`
        .subs-table th, .subs-table td {
          border: 1px solid #e2e8f0;
          padding: 12px 16px !important;
        }
      `}</style>
      <table className="subs-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
            <th style={{ padding: '16px' }}>MEMBER</th>
            <th style={{ padding: '16px' }}>PHONE</th>
            <th style={{ padding: '16px' }}>PLAN TYPE</th>
            <th style={{ padding: '16px' }}>JOIN DATE</th>
            <th style={{ padding: '16px' }}>EXPIRY DATE</th>
            <th style={{ padding: '16px' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.length === 0 ? (
            <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No subscriptions found for this timeframe.</td></tr>
          ) : filteredMembers.map(m => {
            const expiry = getExpiryDate(m.join_date, m.plan_type);
            const isPast = expiry < new Date();
            return (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>{m.full_name || m.username}</td>
                <td style={{ padding: '16px', color: '#64748b' }}>{m.phone || 'N/A'}</td>
                <td style={{ padding: '16px' }}><span className="badge-soft blue">{m.plan_type || 'Monthly Plan'}</span></td>
                <td style={{ padding: '16px', color: '#64748b' }}>{new Date(m.join_date).toLocaleDateString()}</td>
                <td style={{ padding: '16px', fontWeight: '600', color: isPast ? '#ef4444' : '#0f172a' }}>{expiry.toLocaleDateString()}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge-soft ${isPast ? 'red' : 'orange'}`}>{isPast ? 'Expired' : 'Expiring Soon'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PaymentsSection = ({
  realPayments,
  fetchPayments,
  members,
  activePaymentsTab = 'overview'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    status: 'Paid',
    plan_description: 'Custom Plan'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [gymSettings, setGymSettings] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    fetchGymSettings();
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchGymSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      if (res.success) {
        setGymSettings(res.data);
      }
    } catch (e) {
      console.error('Failed to load gym settings for receipt printing', e);
    }
  };

  const getInvoiceNumber = (paymentId) => {
    const sorted = [...(realPayments || [])].sort((a, b) => a.id - b.id);
    const index = sorted.findIndex(p => p.id === paymentId);
    const serial = index !== -1 ? index + 1 : 1;
    const formattedSerial = String(serial).padStart(4, '0');
    const hasTax = gymSettings && (gymSettings.enable_tax === true || gymSettings.enable_tax === 1 || gymSettings.enable_tax === '1');
    return hasTax ? `GST-${formattedSerial}` : `INV-${formattedSerial}`;
  };

  const displayPayments = (realPayments || []).filter(p => {
    // Search
    const searchLower = searchTerm.toLowerCase();
    const invoiceNo = getInvoiceNumber(p.id).toLowerCase();
    const memberName = (p.member_name || p.full_name || 'Member').toLowerCase();
    const paymentIdStr = String(p.transaction_id || p.p_id || `PAY-${p.id}`).toLowerCase();
    
    if (searchTerm && !invoiceNo.includes(searchLower) && !memberName.includes(searchLower) && !paymentIdStr.includes(searchLower)) {
      return false;
    }

    // Method
    const method = p.method || p.p_method || 'Manual';
    if (selectedMethod !== 'All' && method !== selectedMethod) {
      return false;
    }

    // Status
    const status = p.p_status || p.status;
    if (selectedStatus !== 'All' && status !== selectedStatus) {
      return false;
    }

    // Date
    const paymentDate = p.created_at || p.p_date;
    if (selectedDate && paymentDate) {
      const pDateObj = new Date(paymentDate);
      const sDateObj = new Date(selectedDate);
      if (
        pDateObj.getFullYear() !== sDateObj.getFullYear() ||
        pDateObj.getMonth() !== sDateObj.getMonth() ||
        pDateObj.getDate() !== sDateObj.getDate()
      ) {
        return false;
      }
    }

    return true;
  });

  // Compute dynamic chart data
  const methodCounts = {};
  const statusCounts = {};
  let d_totalCollection = 0;
  let d_received = 0;
  let d_pending = 0;
  let d_refunded = 0;

  displayPayments.forEach(p => {
    let method = p.method || p.p_method || 'UPI';
    methodCounts[method] = (methodCounts[method] || 0) + 1;

    let status = p.p_status || p.status || 'Paid';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    let amt = parseFloat(p.amount || p.p_amount) || 0;
    d_totalCollection += amt;
    if (status === 'Paid') d_received += amt;
    else if (status === 'Pending') d_pending += amt;
    else if (status === 'Refunded') d_refunded += amt;
  });

  const methodColors = { 'UPI': '#0f172a', 'Card': '#3b82f6', 'Cash': '#22c55e', 'Manual': '#64748b' };
  const dynamicMethodPie = Object.keys(methodCounts).map(method => ({
    name: method,
    value: methodCounts[method],
    color: methodColors[method] || '#94a3b8'
  }));

  const statusColors = { 'Paid': '#22c55e', 'Pending': '#f97316', 'Refunded': '#a855f7', 'Active': '#22c55e', 'Expired': '#ef4444', 'Paused': '#f59e0b', 'Trial': '#10b981' };
  const dynamicStatusPie = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status],
    color: statusColors[status] || '#94a3b8'
  }));

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ member_id: '', amount: '', status: 'Paid', plan_description: 'Custom Plan' });
    setShowModal(true);
  };

  const openEditModal = (payment) => {
    setEditingId(payment.id);
    setFormData({
      member_id: payment.member_id || '',
      amount: payment.amount || '',
      status: payment.status || 'Paid',
      plan_description: payment.plan_description || 'Custom Plan'
    });
    setShowModal(true);
  };

  const confirmDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsAPI.delete(id);
        toast.success("Payment deleted successfully!");
        fetchPayments();
      } catch (error) {
        toast.error("Failed to delete payment");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await paymentsAPI.update(editingId, { status: formData.status });
        toast.success("Payment updated successfully!");
      } else {
        await paymentsAPI.create(formData);
        toast.success("Payment recorded successfully!");
      }
      setShowModal(false);
      fetchPayments();
    } catch (error) {
      toast.error(`Failed to ${editingId ? 'update' : 'record'} payment`);
    }
  };

  return (
    <div>
      {/* TOP STATS FOR PAYMENTS */}
      <div className="stats-container col-4" style={{ gap: '12px', marginBottom: '16px' }}>
        <div className="stat-card" style={{ padding: '8px 12px' }}>
          <div className="stat-header">
            <h3 className="stat-title" style={{fontSize: '0.7rem'}}>TOTAL COLLECTION</h3>
            <div className="stat-icon" style={{width:24, height:24, fontSize:'0.85rem'}}><strong>₹</strong></div>
          </div>
          <p className="stat-value" style={{fontSize: '1.1rem', margin: '4px 0'}}>₹{d_totalCollection.toLocaleString()}</p>
          <div className="stat-trend positive" style={{fontSize: '0.65rem'}}>↑ 12.5% <span>vs last month</span></div>
        </div>
        <div className="stat-card" style={{ padding: '8px 12px' }}>
          <div className="stat-header">
            <h3 className="stat-title" style={{fontSize: '0.7rem'}}>RECEIVED</h3>
            <div className="stat-icon" style={{width:24, height:24, fontSize:'0.85rem', background: '#dcfce7', color: '#22c55e'}}><FiCheckCircle /></div>
          </div>
          <p className="stat-value" style={{fontSize: '1.1rem', margin: '4px 0'}}>₹{d_received.toLocaleString()}</p>
          <div className="stat-trend positive" style={{fontSize: '0.65rem'}}>↑ 10.2% <span>vs last month</span></div>
        </div>
        <div className="stat-card" style={{ padding: '8px 12px' }}>
          <div className="stat-header">
            <h3 className="stat-title" style={{fontSize: '0.7rem'}}>PENDING</h3>
            <div className="stat-icon" style={{width:24, height:24, fontSize:'0.85rem', background: '#fff7ed', color: '#f97316'}}><FiClock /></div>
          </div>
          <p className="stat-value" style={{fontSize: '1.1rem', margin: '4px 0'}}>₹{d_pending.toLocaleString()}</p>
          <div className="stat-trend positive" style={{fontSize: '0.65rem'}}>↑ 8.7% <span>vs last month</span></div>
        </div>
        <div className="stat-card" style={{ padding: '8px 12px' }}>
          <div className="stat-header">
            <h3 className="stat-title" style={{fontSize: '0.7rem'}}>REFUNDED</h3>
            <div className="stat-icon" style={{width:24, height:24, fontSize:'0.85rem', background: '#fdf4ff', color: '#a855f7'}}><FiRefreshCw /></div>
          </div>
          <p className="stat-value" style={{fontSize: '1.1rem', margin: '4px 0'}}>₹{d_refunded.toLocaleString()}</p>
          <div className="stat-trend negative" style={{fontSize: '0.65rem'}}>↓ 3.2% <span>vs last month</span></div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="filter-toolbar" style={{ display: 'flex', flexWrap: 'nowrap', width: '100%', overflowX: 'auto', gap: '12px', alignItems: 'center' }}>
        <div className="filter-group" style={{ display: 'flex', flexWrap: 'nowrap', gap: '12px', flex: 1 }}>
          <div className="filter-search" style={{ minWidth: '200px', flex: 1 }}>
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search by member name, invoice no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input 
            type="date" 
            className="filter-date filter-select" 
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', outline: 'none', minWidth: '130px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <select 
            className="filter-select"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', background: '#fff', outline: 'none', minWidth: '110px' }}
          >
            <option value="All">All Modes</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="Manual">Manual</option>
          </select>
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', background: '#fff', outline: 'none', minWidth: '110px' }}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
        <div className="filter-group" style={{ display: 'flex', flexWrap: 'nowrap', gap: '12px' }}>
          <button className="btn-export" style={{ whiteSpace: 'nowrap' }}><FiDownload /> Export</button>
          <button className="btn-primary" style={{ background: '#f97316', border: 'none', whiteSpace: 'nowrap' }} onClick={openCreateModal}><FiPlus /> Record Payment</button>
        </div>
      </div>

      {activePaymentsTab === 'overview' ? (
        <>
          {/* TABLE */}
          <div className="list-card" style={{ padding: '0', overflowX: 'auto', marginBottom: '24px' }}>
            <style>{`
              .payments-table th, .payments-table td {
                border: 1px solid #e2e8f0;
                padding: 8px 16px !important;
              }
            `}</style>
            <table className="payments-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                  <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" /></th>
                  <th style={{ padding: '16px' }}>PAYMENT ID</th>
                  <th style={{ padding: '16px' }}>INVOICE NO.</th>
                  <th style={{ padding: '16px' }}>MEMBER</th>
                  <th style={{ padding: '16px' }}>PLAN / DESCRIPTION</th>
                  <th style={{ padding: '16px' }}>AMOUNT</th>
                  <th style={{ padding: '16px' }}>METHOD</th>
                  <th style={{ padding: '16px' }}>STATUS</th>
                  <th style={{ padding: '16px' }}>PAYMENT DATE</th>
                  <th style={{ padding: '16px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {displayPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p, i) => {
                  let p_status = p.p_status || p.status;
                  let statusClass = 'badge-soft green';
                  if (p_status === 'Pending') statusClass = 'badge-soft orange';
                  if (p_status === 'Refunded') statusClass = 'badge-soft purple';

                  let plan_type = p.plan_description || p.plan_type;
                  let planClass = 'badge-soft orange';
                  if (plan_type === 'Quarterly Plan') planClass = 'badge-soft blue';
                  if (plan_type === 'Yearly Plan') planClass = 'badge-soft green';
                  if (plan_type === 'Custom Plan') planClass = 'badge-soft purple';

                  let created_at = p.created_at || p.p_date;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}><input type="checkbox" /></td>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>{p.transaction_id || p.p_id || `PAY-${p.id}`}</td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{getInvoiceNumber(p.id)}</td>
                      <td style={{ padding: '16px' }}>
                        <div className="user-info-wrapper">
                          <div className="user-details">
                            <h4 style={{fontSize: '0.8rem'}}>{p.member_name || p.full_name || 'Member'}</h4>
                            <p style={{fontSize: '0.7rem'}}>M-{1000 + (p.member_id || p.id)}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}><span className={planClass}>{plan_type || 'Monthly Plan'}</span></td>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>₹{parseFloat(p.amount || p.p_amount).toLocaleString()}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem'}}>₹</span>
                          <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>{p.method || p.p_method || 'Manual'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}><span className={statusClass}>{p_status}</span></td>
                      <td style={{ padding: '16px', color: '#64748b' }}>
                        {created_at ? new Date(created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Invalid Date'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="action-icons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <FiEye style={{cursor: 'pointer', color: '#10b981'}} onClick={() => { setSelectedReceiptPayment(p); setShowReceiptModal(true); }} title="View Invoice" />
                          <FiEdit2 onClick={() => openEditModal(p)} style={{cursor: 'pointer', color: '#3b82f6'}} title="Edit Status" />
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <FiMoreVertical
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === p.id ? null : p.id);
                              }}
                              style={{cursor: 'pointer', color: '#64748b'}}
                              title="Options"
                            />
                            {activeDropdownId === p.id && (
                              <div style={{
                                position: 'absolute', right: 0, top: '22px', background: '#fff',
                                border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 100, display: 'flex', flexDirection: 'column', width: '130px', overflow: 'hidden'
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReceiptPayment(p);
                                    setShowReceiptModal(true);
                                    setActiveDropdownId(null);
                                  }}
                                  style={{
                                    padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left',
                                    fontSize: '0.75rem', cursor: 'pointer', color: '#0f172a', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <FiPrinter size={13} /> Print Invoice
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDelete(p.id);
                                    setActiveDropdownId(null);
                                  }}
                                  style={{
                                    padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left',
                                    fontSize: '0.75rem', cursor: 'pointer', color: '#ef4444', fontWeight: '600',
                                    borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  🗑 Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayPayments.length === 0 && (
                  <tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No payments recorded yet.</td></tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
              <div>Showing {displayPayments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, displayPayments.length)} of {displayPayments.length} payments</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <select
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <div className="page-controls">
                  <button className="page-btn" disabled={currentPage === 1 || displayPayments.length === 0} onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
                  {Array.from({ length: Math.ceil(displayPayments.length / itemsPerPage) }, (_, i) => {
                    const page = i + 1;
                    const total = Math.ceil(displayPayments.length / itemsPerPage);
                    if (page === 1 || page === total || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={`ellipsis-${page}`} style={{ padding: '4px' }}>...</span>;
                    }
                    return null;
                  })}
                  <button className="page-btn" disabled={currentPage === Math.ceil(displayPayments.length / itemsPerPage) || displayPayments.length === 0} onClick={() => setCurrentPage(currentPage + 1)}>›</button>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM CHARTS */}
          <div className="charts-container" style={{ gridTemplateColumns: '1fr 1fr 1.5fr' }}>
            <div className="chart-card" style={{ padding: '24px 20px' }}>
              <div className="chart-card-header"><h3 style={{fontSize: '1rem'}}>Payments by Method</h3><select style={{ border: 'none', color: '#64748b', fontSize: '0.75rem', outline: 'none' }}><option>This Month</option></select></div>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '10px 0' }}>
                <div style={{ width: '50%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={dynamicMethodPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                        {dynamicMethodPie.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>{displayPayments.length}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Total</div>
                  </div>
                </div>
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dynamicMethodPie.map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div> <span style={{ color: '#64748b', fontWeight: '500' }}>{item.name}</span></div>
                      <div style={{fontWeight: '700', color: '#0f172a'}}>{item.value} <span style={{color:'#94a3b8', fontWeight: 'normal'}}>({Math.round((item.value/displayPayments.length)*100) || 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card" style={{ padding: '24px 20px' }}>
              <div className="chart-card-header"><h3 style={{fontSize: '1rem'}}>Payments by Status</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '10px 0' }}>
                <div style={{ width: '50%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={dynamicStatusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                        {dynamicStatusPie.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>{displayPayments.length}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Total</div>
                  </div>
                </div>
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dynamicStatusPie.map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div> <span style={{ color: '#64748b', fontWeight: '500' }}>{item.name}</span></div>
                      <div style={{fontWeight: '700', color: '#0f172a'}}>{item.value} <span style={{color:'#94a3b8', fontWeight: 'normal'}}>({Math.round((item.value/displayPayments.length)*100) || 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="list-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
              <div className="list-header" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem' }}>Recent Transactions</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayPayments.slice(0, 4).map((p, i) => {
                  let p_status = p.p_status || p.status;
                  let created_at = p.created_at || p.p_date;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: p_status === 'Refunded' ? '#fee2e2' : '#dcfce7', color: p_status === 'Refunded' ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        {p_status === 'Refunded' ? '↓' : '↑'}
                      </div>
                      <div style={{ flex: 1.5, marginLeft: '12px', fontWeight: '600', color: '#0f172a', fontSize: '0.75rem' }}>{p.member_name || p.full_name || 'Member'}</div>
                      <div style={{ flex: 1, fontSize: '0.7rem', color: '#64748b' }}>{getInvoiceNumber(p.id)}</div>
                      <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: '600', color: p_status === 'Refunded' ? '#ef4444' : '#22c55e' }}>₹{parseFloat(p.amount || p.p_amount).toLocaleString()}</div>
                      <div style={{ flex: 1.5, fontSize: '0.7rem', color: '#64748b', textAlign: 'right' }}>{created_at ? new Date(created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                      <div style={{ width: '60px', textAlign: 'right' }}><span className={p_status === 'Paid' ? 'text-green' : (p_status === 'Pending' ? 'text-orange' : 'text-purple')} style={{fontSize: '0.7rem'}}>{p_status}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <ExpiringSubscriptionsTable members={members || []} activeTab={activePaymentsTab} />
      )}

      {/* RECORD / EDIT PAYMENT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#0f172a' }}>{editingId ? 'Edit Payment' : 'Record Payment'}</h3>
            <form onSubmit={handleSubmit}>
              {!editingId && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Member</label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    required
                  >
                    <option value="">Select a member</option>
                    {members && members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name || m.username}</option>
                    ))}
                  </select>
                </div>
              )}

              {!editingId && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  required
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', background: '#f97316', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500' }}>{editingId ? 'Update' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE / RECEIPT MODAL */}
      {showReceiptModal && selectedReceiptPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', position: 'relative' }}>

            {/* Close Button */}
            <button
              onClick={() => setShowReceiptModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
            >
              <FiX />
            </button>

            {/* Printable Invoice */}
            <div id="gym-invoice-print-area" style={{ fontFamily: 'inherit', color: '#0f172a' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  {gymSettings?.logo_path ? (
                    <img src={gymSettings.logo_path} alt="Logo" style={{ maxHeight: '50px', marginBottom: '8px' }} />
                  ) : (
                    <div style={{ fontWeight: '800', fontSize: '1.4rem', color: '#0f172a', marginBottom: '4px' }}>
                      {gymSettings?.name || 'POWER GYM'}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.6' }}>
                    {gymSettings?.address || 'Fitness Avenue, Ground Floor'}<br />
                    Phone: {gymSettings?.phone || '+91 98765 43210'}<br />
                    Email: {gymSettings?.email || 'info@powergym.com'}
                    {gymSettings?.enable_tax && gymSettings?.tax_registration_no && (
                      <><br />GSTIN: <strong>{gymSettings.tax_registration_no}</strong></>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f97316', letterSpacing: '2px', marginBottom: '6px' }}>
                    {gymSettings && (gymSettings.enable_tax === true || gymSettings.enable_tax === 1 || gymSettings.enable_tax === '1') ? 'TAX INVOICE' : 'INVOICE'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.8' }}>
                    <strong>Invoice No:</strong> {getInvoiceNumber(selectedReceiptPayment.id)}<br />
                    <strong>Date:</strong> {new Date(selectedReceiptPayment.created_at || selectedReceiptPayment.p_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br />
                    <strong>Status:</strong> <span style={{ color: (selectedReceiptPayment.p_status || selectedReceiptPayment.status) === 'Paid' ? '#16a34a' : '#ea580c', fontWeight: 'bold' }}>{selectedReceiptPayment.p_status || selectedReceiptPayment.status}</span>
                  </div>
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '2px solid #e2e8f0', margin: '0 0 20px 0' }} />

              {/* Bill To */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginBottom: '6px' }}>Billed To</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>{selectedReceiptPayment.member_name || selectedReceiptPayment.full_name || 'Member'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Member ID: M-{1000 + (selectedReceiptPayment.member_id || selectedReceiptPayment.id)}</div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#fff' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '600', borderRadius: '6px 0 0 0' }}>Description</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', borderRadius: '0 6px 0 0' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReceiptPayment.plan_description || selectedReceiptPayment.plan_type || 'Monthly Subscription'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>Gym access and facilities — valid membership period</div>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                      ₹{parseFloat(selectedReceiptPayment.amount || selectedReceiptPayment.p_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ width: '260px', fontSize: '0.82rem' }}>
                  {gymSettings && (gymSettings.enable_tax === true || gymSettings.enable_tax === 1 || gymSettings.enable_tax === '1') ? (() => {
                    const raw = parseFloat(selectedReceiptPayment.amount || selectedReceiptPayment.p_amount || 0);
                    const rate = parseFloat(gymSettings.tax_rate || 0);
                    const base = gymSettings.tax_calculation_type === 'inclusive' ? raw / (1 + rate / 100) : raw;
                    const tax = gymSettings.tax_calculation_type === 'inclusive' ? (raw - base) : (raw * rate / 100);
                    const taxName = (gymSettings.tax_name || 'GST').toUpperCase();
                    const halfRate = rate / 2;
                    const halfTax = tax / 2;
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#475569', borderBottom: '1px dashed #e2e8f0' }}>
                          <span>Subtotal:</span>
                          <span>₹{base.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {taxName.includes('GST') ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#475569' }}>
                              <span>CGST ({halfRate}%):</span>
                              <span>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#475569', borderBottom: '1px dashed #e2e8f0' }}>
                              <span>SGST ({halfRate}%):</span>
                              <span>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#475569', borderBottom: '1px dashed #e2e8f0' }}>
                            <span>{gymSettings.tax_name} ({rate}%):</span>
                            <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </>
                    );
                  })() : null}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px 0', fontWeight: '800', color: '#f97316', fontSize: '1rem', borderTop: '2px solid #0f172a' }}>
                    <span>Total Amount:</span>
                    <span>
                      ₹{(() => {
                        const raw = parseFloat(selectedReceiptPayment.amount || selectedReceiptPayment.p_amount || 0);
                        const rate = parseFloat(gymSettings?.tax_rate || 0);
                        const total = (gymSettings && (gymSettings.enable_tax === true || gymSettings.enable_tax === 1 || gymSettings.enable_tax === '1') && gymSettings.tax_calculation_type === 'exclusive')
                          ? raw * (1 + rate / 100)
                          : raw;
                        return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.78rem', color: '#475569' }}>
                <strong>Payment Method:</strong> {selectedReceiptPayment.method || selectedReceiptPayment.p_method || 'Manual / Cash'}
                {selectedReceiptPayment.transaction_id && <> &nbsp;|&nbsp; <strong>Transaction ID:</strong> {selectedReceiptPayment.transaction_id}</>}
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                Thank you for your payment! Stay fit and keep pushing. 💪
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printContents = document.getElementById('gym-invoice-print-area').innerHTML;
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice - ${getInvoiceNumber(selectedReceiptPayment.id)}</title>
                        <style>
                          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #0f172a; }
                          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                          th, td { padding: 12px 10px; border-bottom: 1px solid #cbd5e1; }
                          th { background: #0f172a; color: #fff; text-align: left; }
                          @media print { body { -webkit-print-color-adjust: exact; } }
                        </style>
                      </head>
                      <body>
                        ${printContents}
                        <script>
                          window.onload = function() { window.print(); window.close(); }
                        <\/script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                style={{ padding: '9px 18px', borderRadius: '8px', background: '#f97316', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FiPrinter /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsSection;
