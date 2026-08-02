import React, { useState, useEffect, useCallback } from 'react';
import { FiTool, FiPlus, FiSearch, FiFilter, FiDollarSign, FiEdit2, FiTrash2, FiActivity, FiTag, FiCalendar, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiAlertCircle, FiClock, FiMapPin, FiFileText, FiCheckCircle, FiShield, FiFile, FiDownload } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { equipmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  'Working':           { color: '#16a34a', bg: '#dcfce7' },
  'Under Maintenance': { color: '#d97706', bg: '#fef3c7' },
  'Out of Service':    { color: '#dc2626', bg: '#fee2e2' },
  'Retired':           { color: '#6b7280', bg: '#f3f4f6' },
};

const CONDITION_COLORS = {
  'Excellent': '#059669',
  'Good':      '#10b981',
  'Fair':      '#d97706',
  'Poor':      '#dc2626',
};

const AREAS = [
  'Cardio Zone', 'Strength Zone', 'Free Weight Area',
  'Functional Training Area', 'Reception', 'Locker Room', 'Other'
];

const MAINTENANCE_TYPES = [
  'Preventive Maintenance',
  'Regular Service',
  'Repair',
  'Breakdown',
  'Inspection',
  'Parts Replacement'
];

const FREQUENCIES = [
  'One Time',
  'Monthly',
  'Every 3 Months',
  'Every 6 Months',
  'Yearly'
];

const EquipmentSection = () => {
  const [activeSubTab, setActiveSubTab] = useState('list'); // list, maintenance, history, reports, details
  
  // Data States
  const [stats, setStats] = useState({ total_equipment: 0, active_working: 0, under_maintenance: 0, out_of_service: 0, maintenance_due: 0 });
  const [alerts, setAlerts] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null); // for details page view

  // Pagination & Loading
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({ search: '', category_id: '', status: '', branch: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', category_id: '', status: '', branch: '' });

  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '', asset_code: '', category_id: '', brand: '', model: '', quantity: 1, description: '',
    purchase_date: '', purchase_price: '', is_price_per_unit: true, supplier: '', invoice_no: '',
    warranty_available: false, warranty_start_date: '', warranty_end_date: '', warranty_provider: '', warranty_notes: '',
    branch: '', floor: '', area: 'Cardio Zone', status: 'Working', condition: 'Good',
    create_individual_assets: false, add_to_expenses: false
  });

  // Maintenance Dialog
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintBillFile, setMaintBillFile] = useState(null);
  const [maintForm, setMaintForm] = useState({
    equipment_id: '', type: 'Regular Service', date: new Date().toISOString().slice(0, 10),
    technician: '', cost: '', description: '', parts_replaced: '', next_date: '', notes: '',
    frequency: 'One Time', status: 'Upcoming', update_equipment_status: '', add_to_expenses: false
  });

  // Reports view states
  const [reportType, setReportType] = useState('list');
  const [reportBranch, setReportBranch] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // --- Fetch Operations ---

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await equipmentAPI.getDashboard();
      if (res.success) {
        setStats(res.stats);
        setAlerts(res.alerts || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await equipmentAPI.getItems({ ...appliedFilters, page });
      if (res.success) {
        setEquipmentList(res.data);
        setTotal(res.total);
        setLastPage(res.lastPage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await equipmentAPI.getCategories();
      if (res.success) setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchServiceHistory = useCallback(async () => {
    try {
      const res = await equipmentAPI.getServiceHistory();
      if (res.success) setServiceHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const generateReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await equipmentAPI.getReports({ type: reportType, branch: reportBranch, category_id: reportCategory, status: reportStatus });
      if (res.success) setReportData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  }, [reportType, reportBranch, reportCategory, reportStatus]);

  useEffect(() => {
    fetchDashboardStats();
    fetchCategories();
    fetchServiceHistory();
  }, [fetchDashboardStats, fetchCategories, fetchServiceHistory]);

  useEffect(() => {
    if (activeSubTab === 'list') {
      fetchItems();
      fetchDashboardStats();
    } else if (activeSubTab === 'history') {
      fetchServiceHistory();
    } else if (activeSubTab === 'reports') {
      generateReport();
    }
  }, [activeSubTab, fetchItems, fetchDashboardStats, fetchServiceHistory, generateReport]);

  const handleApplyFilters = () => { setAppliedFilters({ ...filters }); setPage(1); };
  const handleClearFilters = () => { setFilters({ search: '', category_id: '', status: '', branch: '' }); setAppliedFilters({ search: '', category_id: '', status: '', branch: '' }); setPage(1); };

  // --- CRUD Item ---

  const openAddItem = () => {
    setEditingItem(null);
    setInvoiceFile(null);
    setItemForm({
      name: '', asset_code: '',
      category_id: categories[0]?.id || '', brand: '', model: '', quantity: 1, description: '',
      purchase_date: new Date().toISOString().slice(0, 10), purchase_price: '', is_price_per_unit: true,
      supplier: '', invoice_no: '', warranty_available: false, warranty_start_date: '', warranty_end_date: '',
      warranty_provider: '', warranty_notes: '', branch: 'Main Branch', floor: '1st Floor', area: 'Cardio Zone',
      status: 'Working', condition: 'Good', create_individual_assets: false, add_to_expenses: false
    });
    setShowItemModal(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setInvoiceFile(null);
    setItemForm({
      name: item.name, asset_code: item.asset_code, category_id: item.category_id,
      brand: item.brand || '', model: item.model || '', quantity: item.quantity, description: item.description || '',
      purchase_date: item.purchase_date || '', purchase_price: item.purchase_price || '', is_price_per_unit: item.is_price_per_unit === 1,
      supplier: item.supplier || '', invoice_no: item.invoice_no || '', warranty_available: item.warranty_available === 1,
      warranty_start_date: item.warranty_start_date || '', warranty_end_date: item.warranty_end_date || '',
      warranty_provider: item.warranty_provider || '', warranty_notes: item.warranty_notes || '',
      branch: item.branch, floor: item.floor || '', area: item.area || 'Cardio Zone',
      status: item.status, condition: item.condition || 'Good', create_individual_assets: false, add_to_expenses: false
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.asset_code || !itemForm.category_id || !itemForm.branch) {
      toast.error('Please complete all required fields');
      return;
    }

    const formData = new FormData();
    Object.keys(itemForm).forEach(k => {
      formData.append(k, itemForm[k]);
    });
    if (invoiceFile) {
      formData.append('invoice', invoiceFile);
    }

    try {
      let res;
      if (editingItem) {
        res = await equipmentAPI.updateItem(editingItem.id, formData);
        if (res.success) {
          toast.success('Equipment updated');
          fetchItems();
          setShowItemModal(false);
        }
      } else {
        res = await equipmentAPI.createItem(formData);
        if (res.success) {
          toast.success('Equipment registered');
          fetchItems();
          setShowItemModal(false);
        }
      }
    } catch (err) {
      toast.error('Failed to save equipment');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment? All maintenance logs will be deleted.')) return;
    try {
      await equipmentAPI.deleteItem(id);
      toast.success('Equipment deleted');
      fetchItems();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // --- Maintenance Operations ---

  const openScheduleMaintenance = (item = null) => {
    setMaintBillFile(null);
    setMaintForm({
      equipment_id: item ? item.id : (equipmentList[0]?.id || ''),
      type: 'Regular Service',
      date: new Date().toISOString().slice(0, 10),
      technician: '', cost: '', description: '', parts_replaced: '', next_date: '', notes: '',
      frequency: 'One Time', status: 'Upcoming', update_equipment_status: '', add_to_expenses: false
    });
    setShowMaintModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!maintForm.equipment_id || !maintForm.type || !maintForm.date) {
      toast.error('Please complete all fields');
      return;
    }

    const formData = new FormData();
    Object.keys(maintForm).forEach(k => {
      formData.append(k, maintForm[k]);
    });
    if (maintBillFile) {
      formData.append('bill', maintBillFile);
    }

    try {
      const res = await equipmentAPI.addMaintenance(formData);
      if (res.success) {
        toast.success('Maintenance logged successfully');
        fetchDashboardStats();
        fetchItems();
        setShowMaintModal(false);
      }
    } catch (err) {
      toast.error('Failed to save maintenance');
    }
  };

  // Expiry Warranty Helper
  const getWarrantyStatus = (item) => {
    if (!item.warranty_available || item.warranty_available === 0) return '—';
    if (!item.warranty_end_date) return 'Under Warranty';
    const end = new Date(item.warranty_end_date);
    const today = new Date();
    if (end < today) return 'Warranty Expired';
    const diff = end - today;
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return 'Expiring Soon';
    return 'Under Warranty';
  };

  // --- Reports Export ---
  const exportCSV = () => {
    const headers = ['Asset Code', 'Equipment Name', 'Category', 'Quantity', 'Area', 'Purchase Date', 'Purchase Price', 'Status', 'Condition', 'Warranty Status'];
    const lines = reportData.map(r => [
      r.asset_code, `"${r.name}"`, r.category?.name || '—', r.quantity, r.area, r.purchase_date || '—', r.purchase_price, r.status, r.condition, getWarrantyStatus(r)
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment_${reportType}_report.csv`;
    a.click();
  };

  const exportPDF = () => {
    const rows = reportData.map((r, i) => `
      <tr>
        <td>${i+1}</td>
        <td><b>${r.name}</b> (${r.asset_code})</td>
        <td>${r.category?.name || '—'}</td>
        <td style="text-align:center">${r.quantity}</td>
        <td>${r.area || '—'}</td>
        <td style="text-align:right">₹${parseFloat(r.purchase_price).toFixed(2)}</td>
        <td>${r.status}</td>
        <td>${r.condition}</td>
      </tr>
    `).join('');
    const html = `<html><head><title>Equipment Inventory Report</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f8fafc}</style></head>
      <body><h2>Equipment Inventory Audit Report: ${reportType.toUpperCase()}</h2>
      <table><thead><tr><th>#</th><th>Equipment (Asset ID)</th><th>Category</th><th>Qty</th><th>Area</th><th>Price</th><th>Status</th><th>Condition</th></tr></thead>
      <tbody>${rows}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Sub navigation bar */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '6px 12px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { id: 'list', label: 'Equipment List', icon: <FiTool /> },
          { id: 'maintenance', label: 'Schedule Maintenance', icon: <FiCalendar /> },
          { id: 'history', label: 'Service History Logs', icon: <FiClock /> },
          { id: 'reports', label: 'Equipment Reports', icon: <FiFileText /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveSubTab(t.id); setSelectedEquipment(null); }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeSubTab === t.id && !selectedEquipment ? '#dc2626' : 'transparent',
              color: activeSubTab === t.id && !selectedEquipment ? '#fff' : '#64748b',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* DETAILED EQUIPMENT PROFILE VIEW */}
      {selectedEquipment && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <button onClick={() => setSelectedEquipment(null)} style={{ border: '1px solid #e2e8f0', background: 'transparent', borderRadius: '6px', padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', marginBottom: '8px' }}>&larr; Back to List</button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{selectedEquipment.name}</h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace', margin: '4px 0 0 0' }}>Asset ID: {selectedEquipment.asset_code} {selectedEquipment.serial_number && `| S/N: ${selectedEquipment.serial_number}`}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', background: STATUS_CONFIG[selectedEquipment.status]?.bg || '#f1f5f9', color: STATUS_CONFIG[selectedEquipment.status]?.color || '#475569', fontSize: '0.75rem', fontWeight: '700' }}>{selectedEquipment.status}</span>
              <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#f8fafc', color: CONDITION_COLORS[selectedEquipment.condition] || '#1e293b', border: `1.5px solid ${CONDITION_COLORS[selectedEquipment.condition]}`, fontSize: '0.75rem', fontWeight: '700' }}>{selectedEquipment.condition} Condition</span>
            </div>
          </div>

          {/* Quick Profile Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Purchase Price</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>₹{parseFloat(selectedEquipment.purchase_price).toLocaleString()}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Purchase Date</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{selectedEquipment.purchase_date || '—'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Warranty End</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{selectedEquipment.warranty_end_date || 'No Warranty'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Supplier Vendor</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{selectedEquipment.supplier || '—'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Location Zone</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{selectedEquipment.area || '—'}</div>
            </div>
          </div>

          {/* Details Overview / Service Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            
            {/* Overview & Warranty info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <h3 style={{ fontSize: '0.84rem', fontWeight: '700', margin: '0 0 10px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', color: '#dc2626' }}>Warranty Profile</h3>
                {selectedEquipment.warranty_available ? (
                  <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Provider:</span><b>{selectedEquipment.warranty_provider}</b></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Start Date:</span><b>{selectedEquipment.warranty_start_date}</b></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>End Date:</span><b>{selectedEquipment.warranty_end_date}</b></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Status:</span><b style={{ color: '#16a34a' }}>{getWarrantyStatus(selectedEquipment)}</b></div>
                    {selectedEquipment.warranty_notes && <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '4px', marginTop: '4px' }}>{selectedEquipment.warranty_notes}</div>}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>No active warranty registered.</p>
                )}
              </div>

              {selectedEquipment.invoice_path && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0 }}>Purchase Bill Invoice</h4>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{selectedEquipment.invoice_no || 'Document'}</span>
                  </div>
                  <a href={selectedEquipment.invoice_path} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.74rem', textDecoration: 'none', fontWeight: '600' }}>View Invoice</a>
                </div>
              )}
            </div>

            {/* Service Logs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>Maintenance & Repair Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {serviceHistory.filter(s => s.equipment_id === selectedEquipment.id).length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '20px' }}>No maintenance records exist for this item.</p>
                ) : (
                  serviceHistory.filter(s => s.equipment_id === selectedEquipment.id).map(s => (
                    <div key={s.id} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #f8fafc', paddingBottom: '8px', fontSize: '0.78rem' }}>
                      <div style={{ width: '80px', color: '#64748b', fontFamily: 'monospace' }}>{s.date}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700' }}>{s.type}</div>
                        {s.description && <div style={{ color: '#475569', fontSize: '0.74rem', marginTop: '2px' }}>{s.description}</div>}
                        {s.parts_replaced && <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Parts: {s.parts_replaced}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: '#dc2626' }}>₹{parseFloat(s.cost).toLocaleString()}</div>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{s.technician}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* EQUIPMENT LIST SUB TAB */}
      {activeSubTab === 'list' && !selectedEquipment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Top Aggregates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiTool /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.total_equipment}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Total Assets</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiCheckCircle /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.active_working}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Active Working</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiAlertTriangle /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.under_maintenance}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Maintenance</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiAlertCircle /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.out_of_service}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Out of Service</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3e8ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiCalendar /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{stats.maintenance_due}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Maintenance Due</div>
              </div>
            </div>
          </div>

          {/* Alerts row */}
          {alerts.length > 0 && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', padding: '8px 14px', borderRadius: '8px', fontSize: '0.76rem' }}>
              <b>Equipment Alerts:</b> {alerts.map(a => `${a.name} (${a.asset_code}) - ${a.status} (${a.due_date})`).join(' | ')}
            </div>
          )}

          {/* Filters */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
              <input
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                placeholder="Search equipment Name, Asset ID, brand..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
              />
            </div>

            <select
              value={filters.category_id}
              onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input
              value={filters.branch}
              onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}
              placeholder="Branch..."
              style={{ width: '110px', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            />

            <button onClick={handleApplyFilters} style={{ padding: '7px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
            <button onClick={handleClearFilters} style={{ padding: '7px 10px', background: 'transparent', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer' }}>Clear</button>
            
            <button onClick={openAddItem} style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}><FiPlus /> Add Equipment</button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Equipment Master List <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '400' }}>({total} machines)</span></h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Page {page} of {lastPage}</span>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}><FiChevronLeft /></button>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}><FiChevronRight /></button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading gym assets...</div>
            ) : equipmentList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No assets registered. Click "+ Add Equipment" to begin.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Asset ID</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Equipment Name</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Quantity</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Area / Zone</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Purchase Date</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Warranty</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentList.map((item, idx) => {
                    const statusBadge = STATUS_CONFIG[item.status] || { color: '#475569', bg: '#f1f5f9' };
                    const warrantyBadge = getWarrantyStatus(item);
                    return (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{item.asset_code}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                          <span style={{ cursor: 'pointer', color: '#dc2626' }} onClick={() => setSelectedEquipment(item)}>{item.name}</span>
                          {item.brand && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.brand} {item.model}</div>}
                        </td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0' }}>{item.category?.name || '—'}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0' }}>{item.area || '—'}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.purchase_date || '—'}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: warrantyBadge === 'Warranty Expired' ? '#dc2626' : (warrantyBadge === '—' ? '#64748b' : '#16a34a') }}>
                            {warrantyBadge}
                          </span>
                        </td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', background: statusBadge.bg, color: statusBadge.color, fontSize: '0.68rem', fontWeight: '700' }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => openEditItem(item)} title="Edit details" style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer' }}><FiEdit2 size={12} /></button>
                            <button onClick={() => openScheduleMaintenance(item)} title="Schedule Service" style={{ border: 'none', background: 'transparent', color: '#16a34a', cursor: 'pointer' }}><FiCalendar size={12} /></button>
                            <button onClick={() => setSelectedEquipment(item)} title="View Service Profile" style={{ border: 'none', background: 'transparent', color: '#0f172a', cursor: 'pointer' }}><FiFile size={12} /></button>
                            <button onClick={() => handleDeleteItem(item.id)} title="Delete record" style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}><FiTrash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SCHEDULE MAINTENANCE SUB TAB */}
      {activeSubTab === 'maintenance' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><FiCalendar /> Schedule Equipment Maintenance</h3>
          
          <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Select Equipment *</label>
              <select required value={maintForm.equipment_id} onChange={e => setMaintForm(f => ({ ...f, equipment_id: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                <option value="">-- Choose Equipment Unit --</option>
                {equipmentList.map(item => <option key={item.id} value={item.id}>{item.name} ({item.asset_code}) - {item.status}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Maintenance Type *</label>
                <select value={maintForm.type} onChange={e => setMaintForm(f => ({ ...f, type: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Service Date *</label>
                <input required type="date" value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Technician / Provider</label>
                <input value={maintForm.technician} onChange={e => setMaintForm(f => ({ ...f, technician: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. ABC Fitness Services" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Cost (INR)</label>
                <input type="number" min="0" step="any" value={maintForm.cost} onChange={e => setMaintForm(f => ({ ...f, cost: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="0.00" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Parts Replaced</label>
                <input value={maintForm.parts_replaced} onChange={e => setMaintForm(f => ({ ...f, parts_replaced: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Motor Belt" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Next Maintenance Date</label>
                <input type="date" value={maintForm.next_date} onChange={e => setMaintForm(f => ({ ...f, next_date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Frequency</label>
                <select value={maintForm.frequency} onChange={e => setMaintForm(f => ({ ...f, frequency: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  {FREQUENCIES.map(fr => <option key={fr} value={fr}>{fr}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Upload Service Bill</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setMaintBillFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '4px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Update Equipment Status</label>
                <select value={maintForm.update_equipment_status} onChange={e => setMaintForm(f => ({ ...f, update_equipment_status: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  <option value="">Don't Change Status</option>
                  {Object.keys(STATUS_CONFIG).map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                <input type="checkbox" id="add_maint_expense" checked={maintForm.add_to_expenses} onChange={e => setMaintForm(f => ({ ...f, add_to_expenses: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <label htmlFor="add_maint_expense" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Add to Expenses Ledger</label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Work Done / Description</label>
              <textarea rows="3" value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }} placeholder="Detail service actions..." />
            </div>

            <button type="submit" style={{ padding: '9px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>Log Maintenance Job</button>
          </form>

        </div>
      )}

      {/* SERVICE HISTORY SUB TAB */}
      {activeSubTab === 'history' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Gym Service Ledger History</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Equipment</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Maintenance Type</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Technician</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Parts Replaced</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Cost</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Next Service</th>
                <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {serviceHistory.map((h, i) => (
                <tr key={h.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{h.date}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                    <div>{h.equipment?.name}</div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{h.equipment?.asset_code}</span>
                  </td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{h.type}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{h.technician || '—'}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{h.parts_replaced || '—'}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>₹{parseFloat(h.cost).toLocaleString()}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{h.next_date || '—'}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '12px', background: h.status === 'Completed' ? '#dcfce7' : '#fee2e2', color: h.status === 'Completed' ? '#16a34a' : '#dc2626', fontSize: '0.68rem', fontWeight: '700' }}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORTS SUB TAB */}
      {activeSubTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Filters controls */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Report Scope</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}>
                <option value="list">All Equipment Audit</option>
                <option value="out_of_service">Out of Service Machines</option>
                <option value="condition">Condition Audit</option>
                <option value="warranty">Warranty Expiry Audit</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '120px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Branch</label>
              <input value={reportBranch} onChange={e => setReportBranch(e.target.value)} placeholder="Branch name" style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }} />
            </div>

            {reportType === 'condition' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '120px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Condition</label>
                <select value={reportStatus} onChange={e => setReportStatus(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}>
                  <option value="">All Conditions</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            )}

            <button onClick={generateReport} style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '16px' }}>Generate</button>
            <div style={{ width: '1px', height: '24px', background: '#e5e7eb', marginLeft: '6px', marginTop: '16px' }} />
            
            <button onClick={exportCSV} disabled={reportData.length === 0} style={{ padding: '7px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '16px' }}><FiDownload /> CSV</button>
            <button onClick={exportPDF} disabled={reportData.length === 0} style={{ padding: '7px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '16px' }}><FiFileText /> Print PDF</button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {reportLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Generating data...</div>
            ) : reportData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No equipment matches selected criteria.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Asset Code</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Location Zone</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Purchase Price</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, idx) => (
                    <tr key={r.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{r.asset_code}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{r.name}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{r.category?.name || '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{r.quantity}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{r.area || '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{parseFloat(r.purchase_price).toFixed(2)}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{r.status}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: CONDITION_COLORS[r.condition] }}>{r.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT EQUIPMENT --- */}
      {showItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '90%', maxWidth: '1000px', height: '90vh', maxHeight: '720px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{editingItem ? 'Edit Equipment Details' : 'Add Gym Equipment / Machine'}</h3>
              <button onClick={() => setShowItemModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveItem} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100% - 55px)', overflowY: 'auto' }}>
              
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0 }}>Basic Details</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Equipment Name *</label>
                  <input required value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Treadmill" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Asset ID Code *</label>
                  <input required value={itemForm.asset_code} onChange={e => setItemForm(f => ({ ...f, asset_code: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Category *</label>
                  <select required value={itemForm.category_id} onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Brand</label>
                  <input value={itemForm.brand} onChange={e => setItemForm(f => ({ ...f, brand: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. PowerMax" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Model</label>
                  <input value={itemForm.model} onChange={e => setItemForm(f => ({ ...f, model: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. TDA-230" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Quantity *</label>
                  <input required disabled={!!editingItem} type="number" min="1" value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Equipment Description</label>
                <input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Additional notes..." />
              </div>

              {/* Duplicate assets check */}
              {itemForm.quantity > 1 && !editingItem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <input type="checkbox" id="create_individual_assets" checked={itemForm.create_individual_assets} onChange={e => setItemForm(f => ({ ...f, create_individual_assets: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                  <label htmlFor="create_individual_assets" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                    Create Individual Assets (generates separate entries EQ-xxx-01, EQ-xxx-02... for expensive equipment)
                  </label>
                </div>
              )}

              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '6px 0 0 0' }}>Purchase Details</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Purchase Date</label>
                  <input type="date" value={itemForm.purchase_date} onChange={e => setItemForm(f => ({ ...f, purchase_date: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Purchase Price (INR)</label>
                  <input type="number" min="0" step="any" value={itemForm.purchase_price} onChange={e => setItemForm(f => ({ ...f, purchase_price: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="₹ 0.00" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Pricing Type</label>
                  <select value={itemForm.is_price_per_unit} onChange={e => setItemForm(f => ({ ...f, is_price_per_unit: e.target.value === 'true' }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    <option value="true">Price Per Unit</option>
                    <option value="false">Total Purchase Value</option>
                  </select>
                </div>
              </div>

              {itemForm.quantity > 1 && itemForm.purchase_price && (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid #e2e8f0' }}>
                  Calculated Total Asset Value: <b>₹{((itemForm.is_price_per_unit ? itemForm.quantity : 1) * parseFloat(itemForm.purchase_price)).toLocaleString()}</b>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Supplier / Vendor</label>
                  <input value={itemForm.supplier} onChange={e => setItemForm(f => ({ ...f, supplier: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Supplier Name" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Invoice Number</label>
                  <input value={itemForm.invoice_no} onChange={e => setItemForm(f => ({ ...f, invoice_no: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="INV-xxx" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Upload Invoice Bill</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setInvoiceFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                </div>
              </div>

              {!editingItem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <input type="checkbox" id="add_purchase_expense" checked={itemForm.add_to_expenses} onChange={e => setItemForm(f => ({ ...f, add_to_expenses: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                  <label htmlFor="add_purchase_expense" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Automatically add purchase value to Expenses ledger</label>
                </div>
              )}

              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '6px 0 0 0' }}>Warranty Details</h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input type="checkbox" id="warranty_available" checked={itemForm.warranty_available} onChange={e => setItemForm(f => ({ ...f, warranty_available: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <label htmlFor="warranty_available" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Warranty Available</label>
              </div>

              {itemForm.warranty_available && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Warranty Start Date</label>
                    <input type="date" value={itemForm.warranty_start_date} onChange={e => setItemForm(f => ({ ...f, warranty_start_date: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Warranty End Date</label>
                    <input type="date" value={itemForm.warranty_end_date} onChange={e => setItemForm(f => ({ ...f, warranty_end_date: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Warranty Provider</label>
                    <input value={itemForm.warranty_provider} onChange={e => setItemForm(f => ({ ...f, warranty_provider: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Provider Name" />
                  </div>
                </div>
              )}

              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '6px 0 0 0' }}>Location & Status</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Branch *</label>
                  <input required value={itemForm.branch} onChange={e => setItemForm(f => ({ ...f, branch: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Main Branch" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Floor / Area</label>
                  <select value={itemForm.area} onChange={e => setItemForm(f => ({ ...f, area: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Floor Level</label>
                  <input value={itemForm.floor} onChange={e => setItemForm(f => ({ ...f, floor: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Ground Floor" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Current Status</label>
                  <select value={itemForm.status} onChange={e => setItemForm(f => ({ ...f, status: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Current Condition</label>
                  <select value={itemForm.condition} onChange={e => setItemForm(f => ({ ...f, condition: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowItemModal(false)} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Save Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: RECORD/SCHEDULE MAINTENANCE --- */}
      {showMaintModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Schedule Maintenance Job</h3>
              <button onClick={() => setShowMaintModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Select Equipment *</label>
                <select required value={maintForm.equipment_id} onChange={e => setMaintForm(f => ({ ...f, equipment_id: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  <option value="">-- Choose Equipment --</option>
                  {equipmentList.map(i => <option key={i.id} value={i.id}>{i.name} ({i.asset_code})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Type *</label>
                  <select value={maintForm.type} onChange={e => setMaintForm(f => ({ ...f, type: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Date *</label>
                  <input required type="date" value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Technician</label>
                  <input value={maintForm.technician} onChange={e => setMaintForm(f => ({ ...f, technician: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="ABC Service" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Service Cost</label>
                  <input type="number" value={maintForm.cost} onChange={e => setMaintForm(f => ({ ...f, cost: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="₹ 0.00" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input type="checkbox" id="maint_add_expense" checked={maintForm.add_to_expenses} onChange={e => setMaintForm(f => ({ ...f, add_to_expenses: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <label htmlFor="maint_add_expense" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Automatically record as Equipment Maintenance Expense</label>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowMaintModal(false)} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Schedule Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipmentSection;
