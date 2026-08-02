import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiSearch, FiFilter, FiDollarSign, FiEdit2, FiTrash2, FiActivity, FiTag, FiCalendar, FiChevronLeft, FiChevronRight, FiCreditCard, FiUser, FiFileText, FiRefreshCw, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { expensesAPI } from '../../services/api';
import toast from 'react-hot-toast';

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
  Paid:             { color: '#16a34a', bg: '#dcfce7', icon: <FiCheckCircle /> },
  Pending:          { color: '#d97706', bg: '#fef3c7', icon: <FiClock /> },
  'Partially Paid': { color: '#2563eb', bg: '#dbeafe', icon: <FiClock /> },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#475569', bg: '#f1f5f9' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {status || '—'}
    </span>
  );
};

const ExpensesSection = () => {
  const [data, setData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({ category: '', date_from: '', date_to: '', search: '' });
  const [applied, setApplied] = useState({ category: '', date_from: '', date_to: '', search: '' });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Rent',
    date: '',
    payment_method: 'Cash',
    paid_to: '',
    reference_no: '',
    description: '',
    is_recurring: false,
    payment_status: 'Paid'
  });

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
      console.error('Failed to fetch expenses:', e);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleApplyFilters = () => {
    setApplied({ ...filters });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ category: '', date_from: '', date_to: '', search: '' });
    setApplied({ category: '', date_from: '', date_to: '', search: '' });
    setPage(1);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setReceiptFile(null);
    setForm({
      title: '',
      amount: '',
      category: 'Rent',
      date: new Date().toISOString().slice(0, 10),
      payment_method: 'Cash',
      paid_to: '',
      reference_no: '',
      description: '',
      is_recurring: false,
      payment_status: 'Paid'
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setReceiptFile(null);
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      payment_method: expense.payment_method || 'Cash',
      paid_to: expense.paid_to || '',
      reference_no: expense.reference_no || '',
      description: expense.description || '',
      is_recurring: expense.is_recurring === 1 || expense.is_recurring === true,
      payment_status: expense.payment_status || 'Paid'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category || !form.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('amount', form.amount);
    formData.append('category', form.category);
    formData.append('date', form.date);
    formData.append('payment_method', form.payment_method);
    formData.append('payment_status', form.payment_status);
    formData.append('paid_to', form.paid_to);
    formData.append('reference_no', form.reference_no);
    formData.append('description', form.description);
    formData.append('is_recurring', form.is_recurring ? '1' : '0');
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    try {
      let res;
      if (editingExpense) {
        res = await expensesAPI.update(editingExpense.id, formData);
        if (res.success) {
          toast.success('Expense updated successfully');
          fetchExpenses();
          setShowModal(false);
        }
      } else {
        res = await expensesAPI.create(formData);
        if (res.success) {
          toast.success('Expense recorded successfully');
          fetchExpenses();
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error('Save expense error:', err);
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await expensesAPI.delete(id);
      if (res.success) {
        toast.success('Expense deleted successfully');
        fetchExpenses();
      }
    } catch (e) {
      console.error('Delete expense error:', e);
      toast.error('Failed to delete expense');
    }
  };

  const pieData = categorySummary.map(c => ({
    name: c.category,
    value: parseFloat(c.total || 0),
    color: CATEGORY_COLORS[c.category] || '#6b7280'
  })).filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Expense Management</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Track and manage your gym expenses</p>
        </div>
        <button onClick={openAddModal}
          style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(220,38,38,0.2)' }}>
          <FiPlus size={16} /> Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiDollarSign />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: '500' }}>Total Expenses</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiActivity />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>{total}</div>
            <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: '500' }}>Transaction Count</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiTag />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>{categorySummary.length}</div>
            <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: '500' }}>Active Categories</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>{filters.date_from ? 'Filtered' : 'All-time'}</div>
            <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: '500' }}>Time Horizon</div>
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
            onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
            placeholder="Search title, description, vendor, bill no…"
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

        <button onClick={handleApplyFilters}
          style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <FiFilter size={12} /> Apply
        </button>

        <button onClick={handleClearFilters}
          style={{ padding: '7px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Clear
        </button>
      </div>

      {/* Visual Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '15px' }}>
        {/* Category Breakdown Bar Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Expenses by Category</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            {pieData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Share */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Expense Share %</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {pieData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No share data available</div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontWeight: '500', color: '#475569' }}>{d.name}</span>
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

      {/* Data Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Expense Ledger <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>({total} matches)</span>
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
          <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>Loading expenses…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>No expense transactions found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0' }}>Expense Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '100px' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '100px' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '90px' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '100px' }}>Paid To</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '80px' }}>Method</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '80px' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '80px' }}>Receipt</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid #e2e8f0', width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={r.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '7px 12px', color: '#94a3b8', border: '1px solid #e2e8f0', textAlign: 'center' }}>{(page-1)*15+idx+1}</td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.is_recurring === 1 && <FiRefreshCw title="Recurring" style={{ color: '#2563eb', flexShrink: 0 }} size={12} />}
                      <div>
                        <div>{r.title}</div>
                        {r.reference_no && <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>Ref: {r.reference_no}</div>}
                      </div>
                    </div>
                  </td>
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
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    {r.receipt_path ? (
                      <a href={r.receipt_path} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>View</a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => openEditModal(r)} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer' }}><FiEdit2 size={13} /></button>
                      <button onClick={() => handleDelete(r.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record/Edit Expense Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '550px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{editingExpense ? 'Edit Expense Record' : 'Record New Expense'}</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* Expense Date & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Expense Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Expense Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Title & Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Expense Name / Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. July Gym Rent" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Amount (INR) *</label>
                  <input required type="number" min="0" step="any" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="₹ 0.00" />
                </div>
              </div>

              {/* Payment Method & Paid To */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Payment Method *</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Paid To / Vendor</label>
                  <input value={form.paid_to} onChange={e => setForm(f => ({ ...f, paid_to: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Building Owner" />
                </div>
              </div>

              {/* Reference No & Payment Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Reference / Bill No.</label>
                  <input value={form.reference_no} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. RENT-JUL-26" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Payment Status *</label>
                  <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
              </div>

              {/* Receipt File Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Receipt / Bill (JPG, PNG, PDF)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setReceiptFile(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#475569' }} />
                {editingExpense && editingExpense.receipt_path && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Current Receipt: <a href={editingExpense.receipt_path} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>View File</a></span>
                )}
              </div>

              {/* Recurring Switch & Description */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input type="checkbox" id="is_recurring" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <label htmlFor="is_recurring" style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Recurring Expense (monthly interval)</label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Description / Notes</label>
                <textarea rows="2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }} placeholder="Optional details..." />
              </div>

              {/* Form Buttons */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesSection;
