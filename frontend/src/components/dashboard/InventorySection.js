import React, { useState, useEffect, useCallback } from 'react';
import { FiBox, FiPlus, FiMinus, FiSearch, FiFilter, FiDollarSign, FiEdit2, FiTrash2, FiActivity, FiTag, FiCalendar, FiChevronLeft, FiChevronRight, FiUsers, FiTrendingUp, FiDownload, FiFileText, FiRefreshCw, FiAlertTriangle, FiAlertCircle, FiClock, FiMapPin, FiTruck } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { inventoryAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGES = {
  'In Stock':      { color: '#16a34a', bg: '#dcfce7' },
  'Low Stock':     { color: '#d97706', bg: '#fef3c7' },
  'Out of Stock':  { color: '#dc2626', bg: '#fee2e2' },
  'Expiring Soon': { color: '#8b5cf6', bg: '#f3e8ff' },
  'Expired':       { color: '#7f1d1d', bg: '#fecaca' },
};

const UNITS = ['Piece', 'Box', 'Bottle', 'Pack', 'KG', 'Litre'];

const REASONS_STOCK_IN = [
  'Purchase',
  'Customer Return',
  'Opening Stock',
  'Stock Adjustment',
  'Transfer from Another Branch'
];

const REASONS_STOCK_OUT = [
  'Sold',
  'Internal Gym Use',
  'Damaged',
  'Expired',
  'Lost',
  'Stock Adjustment',
  'Transfer to Another Branch'
];

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#f97316', '#a855f7', '#06b6d4', '#84cc16'
];

const InventorySection = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, products, stock-in, stock-out, suppliers, categories, history, reports
  
  // Data States
  const [dashboardStats, setDashboardStats] = useState({ total_items: 0, total_stock_value: 0, low_stock_items: 0, out_of_stock_items: 0, expiring_soon: 0 });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Pagination & Loading
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsLastPage, setItemsLastPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLastPage, setHistoryLastPage] = useState(1);

  // Filters
  const [itemFilters, setItemFilters] = useState({ search: '', category_id: '', status: '', branch: '', supplier_id: '' });
  const [appliedItemFilters, setAppliedItemFilters] = useState({ search: '', category_id: '', status: '', branch: '', supplier_id: '' });
  const [historyFilters, setHistoryFilters] = useState({ item_id: '', type: '', date_from: '', date_to: '' });
  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState({ item_id: '', type: '', date_from: '', date_to: '' });

  // Modal / Form States
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '', sku: '', category_id: '', brand: '', description: '',
    opening_stock: 0, unit: 'Piece', reorder_level: 5,
    purchase_price: '', selling_price: '', tax_percent: 0,
    supplier_id: '', purchase_date: '', batch_number: '', expiry_date: '',
    location: '', branch: ''
  });

  // Supplier Form
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '', notes: '', status: 'active' });

  // Category Form
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', status: 'active' });

  // Transaction Forms (Dedicated inline or sub-tab forms)
  const [stockInForm, setStockInForm] = useState({ item_id: '', quantity: '', date: new Date().toISOString().slice(0, 10), reason: 'Purchase', purchase_price: '', supplier_id: '', invoice_no: '', batch_number: '', expiry_date: '', branch: '', notes: '', add_to_expenses: false });
  const [stockInReceipt, setStockInReceipt] = useState(null);
  const [stockOutForm, setStockOutForm] = useState({ item_id: '', quantity: '', date: new Date().toISOString().slice(0, 10), reason: 'Sold', branch: '', reference: '', notes: '' });

  // Reports
  const [reportType, setReportType] = useState('current_stock');
  const [reportBranch, setReportBranch] = useState('');
  const [reportExpiryStatus, setReportExpiryStatus] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // --- Fetch Operations ---

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await inventoryAPI.getDashboard();
      if (res.success) {
        setDashboardStats(res.stats);
        setLowStockAlerts(res.low_stock_alerts || []);
        setExpiryAlerts(res.expiry_alerts || []);
      }
    } catch (e) {
      console.error('Failed to load inventory dashboard:', e);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const res = await inventoryAPI.getItems({ ...appliedItemFilters, page: itemsPage });
      if (res.success) {
        setItems(res.data);
        setItemsTotal(res.total);
        setItemsLastPage(res.lastPage);
      }
    } catch (e) {
      console.error('Failed to load inventory items:', e);
    } finally {
      setItemsLoading(false);
    }
  }, [appliedItemFilters, itemsPage]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await inventoryAPI.getCategories();
      if (res.success) setCategories(res.data);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await inventoryAPI.getSuppliers();
      if (res.success) setSuppliers(res.data);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await inventoryAPI.getHistory({ ...appliedHistoryFilters, page: historyPage });
      if (res.success) {
        setHistory(res.data);
        setHistoryTotal(res.total);
        setHistoryLastPage(res.lastPage);
      }
    } catch (e) {
      console.error('Failed to load inventory history:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [appliedHistoryFilters, historyPage]);

  const fetchReportData = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await inventoryAPI.getReports({ type: reportType, branch: reportBranch, expiry_status: reportExpiryStatus });
      if (res.success) {
        setReportData(res.data);
      }
    } catch (e) {
      console.error('Failed to load report data:', e);
    } finally {
      setReportLoading(false);
    }
  }, [reportType, reportBranch, reportExpiryStatus]);

  // Initial Boot
  useEffect(() => {
    fetchDashboard();
    fetchCategories();
    fetchSuppliers();
  }, [fetchDashboard, fetchCategories, fetchSuppliers]);

  // Sync Tabs
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
      fetchItems();
    } else if (activeTab === 'products') {
      fetchItems();
    } else if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'suppliers') {
      fetchSuppliers();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'reports') {
      fetchReportData();
    }
  }, [activeTab, fetchDashboard, fetchItems, fetchHistory, fetchSuppliers, fetchCategories, fetchReportData]);

  // Filters Handlers
  const handleApplyItemFilters = () => { setAppliedItemFilters({ ...itemFilters }); setItemsPage(1); };
  const handleClearItemFilters = () => { setItemFilters({ search: '', category_id: '', status: '', branch: '', supplier_id: '' }); setAppliedItemFilters({ search: '', category_id: '', status: '', branch: '', supplier_id: '' }); setItemsPage(1); };
  
  const handleApplyHistoryFilters = () => { setAppliedHistoryFilters({ ...historyFilters }); setHistoryPage(1); };
  const handleClearHistoryFilters = () => { setHistoryFilters({ item_id: '', type: '', date_from: '', date_to: '' }); setAppliedHistoryFilters({ item_id: '', type: '', date_from: '', date_to: '' }); setHistoryPage(1); };

  // --- CRUD Functions ---

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemImageFile(null);
    setItemForm({
      name: '', sku: '',
      category_id: categories[0]?.id || '', brand: '', description: '',
      opening_stock: 0, unit: 'Piece', reorder_level: 5,
      purchase_price: '', selling_price: '', tax_percent: 0,
      supplier_id: '', purchase_date: '', batch_number: '', expiry_date: '',
      location: '', branch: ''
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemImageFile(null);
    setItemForm({
      name: item.name, sku: item.sku, category_id: item.category_id,
      brand: item.brand || '', description: item.description || '',
      opening_stock: item.opening_stock, unit: item.unit || 'Piece', reorder_level: item.reorder_level || 5,
      purchase_price: item.purchase_price, selling_price: item.selling_price || '', tax_percent: item.tax_percent || 0,
      supplier_id: item.supplier_id || '', purchase_date: item.purchase_date || '', batch_number: item.batch_number || '', expiry_date: item.expiry_date || '',
      location: item.location || '', branch: item.branch || ''
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e, addAnother = false) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.category_id || !itemForm.unit || !itemForm.purchase_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    Object.keys(itemForm).forEach(k => {
      formData.append(k, itemForm[k]);
    });
    if (itemImageFile) {
      formData.append('image', itemImageFile);
    }

    try {
      let res;
      if (editingItem) {
        res = await inventoryAPI.updateItem(editingItem.id, formData);
        if (res.success) {
          toast.success('Item updated successfully');
          fetchItems();
          setShowItemModal(false);
        }
      } else {
        res = await inventoryAPI.createItem(formData);
        if (res.success) {
          toast.success('Item created successfully');
          fetchItems();
          fetchDashboard();
          if (addAnother) {
            setItemImageFile(null);
            setItemForm(f => ({ ...f, name: '', sku: '', opening_stock: 0 }));
          } else {
            setShowItemModal(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item? All stock history logs will be deleted.')) return;
    try {
      const res = await inventoryAPI.deleteItem(id);
      if (res.success) {
        toast.success('Item deleted successfully');
        fetchItems();
        fetchDashboard();
      }
    } catch (e) {
      toast.error('Failed to delete item');
    }
  };

  // --- Stock In / Out Submit ---

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockInForm.item_id || !stockInForm.quantity || !stockInForm.date || !stockInForm.reason) {
      toast.error('Please complete all required fields');
      return;
    }

    const formData = new FormData();
    Object.keys(stockInForm).forEach(k => {
      formData.append(k, stockInForm[k]);
    });
    if (stockInReceipt) {
      formData.append('receipt', stockInReceipt);
    }

    try {
      const res = await inventoryAPI.stockIn(formData);
      if (res.success) {
        toast.success('Stock In recorded successfully');
        fetchDashboard();
        setStockInForm({ item_id: '', quantity: '', date: new Date().toISOString().slice(0, 10), reason: 'Purchase', purchase_price: '', supplier_id: '', invoice_no: '', batch_number: '', expiry_date: '', branch: '', notes: '', add_to_expenses: false });
        setStockInReceipt(null);
        setActiveTab('dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process Stock In');
    }
  };

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (!stockOutForm.item_id || !stockOutForm.quantity || !stockOutForm.date || !stockOutForm.reason) {
      toast.error('Please complete all required fields');
      return;
    }

    // Client validation limit
    const selectedItem = items.find(i => i.id === parseInt(stockOutForm.item_id));
    if (selectedItem && parseInt(stockOutForm.quantity) > selectedItem.current_stock) {
      toast.error(`Cannot stock out more than current stock (${selectedItem.current_stock})`);
      return;
    }

    try {
      const res = await inventoryAPI.stockOut(stockOutForm);
      if (res.success) {
        toast.success('Stock Out recorded successfully');
        fetchDashboard();
        setStockOutForm({ item_id: '', quantity: '', date: new Date().toISOString().slice(0, 10), reason: 'Sold', branch: '', reference: '', notes: '' });
        setActiveTab('dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process Stock Out');
    }
  };

  // --- Category / Supplier CRUD Actions ---

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    try {
      if (editingCategory) {
        await inventoryAPI.updateCategory(editingCategory.id, categoryForm);
        toast.success('Category updated');
      } else {
        await inventoryAPI.createCategory(categoryForm);
        toast.success('Category created');
      }
      fetchCategories();
      setShowCategoryModal(false);
    } catch (e) {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await inventoryAPI.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (e) {
      toast.error('Category is linked to items');
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.phone) return;
    try {
      if (editingSupplier) {
        await inventoryAPI.updateSupplier(editingSupplier.id, supplierForm);
        toast.success('Supplier updated');
      } else {
        await inventoryAPI.createSupplier(supplierForm);
        toast.success('Supplier added');
      }
      fetchSuppliers();
      setShowSupplierModal(false);
    } catch (e) {
      toast.error('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Delete supplier?')) return;
    try {
      await inventoryAPI.deleteSupplier(id);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (e) {
      toast.error('Failed to delete supplier');
    }
  };

  // Helper Stock Status Badge generator
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

  // --- Reports Export ---
  const exportReportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Current Stock', 'Unit', 'Purchase Price', 'Selling Price', 'Reorder Level', 'Expiry Date'];
    const lines   = reportData.map(r => [
      r.sku, r.name, r.category?.name || '', r.current_stock, r.unit, r.purchase_price, r.selling_price || 0, r.reorder_level, r.expiry_date || '—'
    ].join(','));
    const csv  = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `inventory_report_${reportType}.csv`;
    a.click();
  };

  const exportReportPDF = () => {
    const rows = reportData.map((r, i) => `
      <tr>
        <td>${i+1}</td>
        <td><b>${r.name}</b> (${r.sku})</td>
        <td>${r.category?.name || '—'}</td>
        <td style="text-align:center">${r.current_stock} ${r.unit}</td>
        <td style="text-align:right">₹${parseFloat(r.purchase_price).toFixed(2)}</td>
        <td style="text-align:right">₹${r.selling_price ? parseFloat(r.selling_price).toFixed(2) : '—'}</td>
        <td>${r.expiry_date || '—'}</td>
      </tr>
    `).join('');
    const html = `<html><head><title>Inventory Report</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f4f4f5;text-align:left}</style></head>
      <body><h2>Inventory Report: ${reportType.toUpperCase().replace('_',' ')}</h2>
      <table><thead><tr><th>#</th><th>Item</th><th>Category</th><th>Stock</th><th>Purchase Price</th><th>Selling Price</th><th>Expiry Date</th></tr></thead>
      <tbody>${rows}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Sub-tab Navigation */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '6px 12px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }}>
        {[
          { id: 'dashboard', label: 'Inventory Dashboard', icon: <FiActivity /> },
          { id: 'products', label: 'Products / Items', icon: <FiBox /> },
          { id: 'stock-in', label: 'Stock In', icon: <FiPlus /> },
          { id: 'stock-out', label: 'Stock Out', icon: <FiMinus /> },
          { id: 'suppliers', label: 'Suppliers', icon: <FiUsers /> },
          { id: 'categories', label: 'Categories', icon: <FiTag /> },
          { id: 'history', label: 'Stock History', icon: <FiClock /> },
          { id: 'reports', label: 'Reports', icon: <FiFileText /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
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
              background: activeTab === t.id ? '#dc2626' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiBox /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{dashboardStats.total_items}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Total Items</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiDollarSign /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>₹{dashboardStats.total_stock_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Stock Value</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiAlertTriangle /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{dashboardStats.low_stock_items}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Low Stock</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiAlertCircle /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{dashboardStats.out_of_stock_items}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Out of Stock</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3e8ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}><FiClock /></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>{dashboardStats.expiring_soon}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Expiring Soon</div>
              </div>
            </div>
          </div>

          {/* Quick Alerts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '12px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#dc2626', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}><FiAlertTriangle /> Low / Out of Stock alerts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {lowStockAlerts.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>All inventory items are sufficiently stocked.</p>
                ) : (
                  lowStockAlerts.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem', background: '#fef2f2', padding: '5px 8px', borderRadius: '5px' }}>
                      <span style={{ fontWeight: '600', color: '#7f1d1d' }}>{a.name} <span style={{ fontWeight: '400', color: '#991b1b', fontSize: '0.65rem' }}>({a.sku})</span></span>
                      <span style={{ fontWeight: '700', color: '#dc2626' }}>{a.current} in stock (Min: {a.required})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '12px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#8b5cf6', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}><FiClock /> Expiry Alerts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {expiryAlerts.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>No items are expiring soon or expired.</p>
                ) : (
                  expiryAlerts.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem', background: '#f5f3ff', padding: '5px 8px', borderRadius: '5px' }}>
                      <span style={{ fontWeight: '600', color: '#5b21b6' }}>{a.name}</span>
                      <span style={{ fontWeight: '700', color: a.status === 'Expired' ? '#dc2626' : '#8b5cf6' }}>{a.status} ({new Date(a.expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Compact Inventory Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Current Stock Overview</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleOpenAddItem} style={{ padding: '5px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><FiPlus /> Add Item</button>
                <button onClick={() => { setActiveTab('stock-in'); setStockInForm(f => ({ ...f, item_id: items[0]?.id || '' })); }} style={{ padding: '5px 10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer' }}>+ Stock In</button>
                <button onClick={() => { setActiveTab('stock-out'); setStockOutForm(f => ({ ...f, item_id: items[0]?.id || '' })); }} style={{ padding: '5px 10px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer' }}>- Stock Out</button>
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>SKU</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Item Name</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '120px' }}>Category</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Stock</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '80px' }}>Unit</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Purchase Price</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Selling Price</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '100px' }}>Stock Value</th>
                  <th style={{ padding: '6px 10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '120px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((item, idx) => {
                  const stat = getStockStatus(item);
                  const badge = STATUS_BADGES[stat] || { color: '#475569', bg: '#f1f5f9' };
                  return (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{item.sku}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{item.name}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0' }}>{item.category?.name || '—'}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: item.current_stock <= item.reorder_level ? '#dc2626' : '#0f172a' }}>{item.current_stock}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', color: '#64748b' }}>{item.unit}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{parseFloat(item.purchase_price).toFixed(2)}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{item.selling_price ? `₹${parseFloat(item.selling_price).toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>₹{(item.current_stock * item.purchase_price).toFixed(2)}</td>
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
          </div>
        </div>
      )}

      {/* PRODUCTS / ITEMS TAB */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Filters Row */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
              <input
                value={itemFilters.search}
                onChange={e => setItemFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleApplyItemFilters()}
                placeholder="Search Item name, SKU, or brand..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box' }}
              />
            </div>

            <select
              value={itemFilters.category_id}
              onChange={e => setItemFilters(f => ({ ...f, category_id: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={itemFilters.status}
              onChange={e => setItemFilters(f => ({ ...f, status: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_BADGES).map(st => <option key={st} value={st}>{st}</option>)}
            </select>

            <input
              value={itemFilters.branch}
              onChange={e => setItemFilters(f => ({ ...f, branch: e.target.value }))}
              placeholder="Filter branch..."
              style={{ width: '120px', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            />

            <select
              value={itemFilters.supplier_id}
              onChange={e => setItemFilters(f => ({ ...f, supplier_id: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            >
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <button onClick={handleApplyItemFilters} style={{ padding: '7px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
            <button onClick={handleClearItemFilters} style={{ padding: '7px 10px', background: 'transparent', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer' }}>Clear</button>
            
            <button onClick={handleOpenAddItem} style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}><FiPlus /> Add Item</button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Item Master List <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '400' }}>({itemsTotal} matches)</span></h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Page {itemsPage} of {itemsLastPage}</span>
                <button onClick={() => setItemsPage(p => Math.max(1, p - 1))} disabled={itemsPage === 1} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}><FiChevronLeft /></button>
                <button onClick={() => setItemsPage(p => Math.min(itemsLastPage, p + 1))} disabled={itemsPage === itemsLastPage} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}><FiChevronRight /></button>
              </div>
            </div>

            {itemsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading products...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No items found. Click "+ Add Item" to create one.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Item Image</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>SKU</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Item Name</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Stock</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Purchase Price</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Selling Price</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '90px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const stat = getStockStatus(item);
                    const badge = STATUS_BADGES[stat] || { color: '#475569', bg: '#f1f5f9' };
                    return (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center', width: '60px' }}>
                          {item.image_path ? (
                            <img src={item.image_path} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><FiBox size={14} /></div>
                          )}
                        </td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{item.sku}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                          <div>{item.name}</div>
                          {item.brand && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Brand: {item.brand}</div>}
                        </td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0' }}>{item.category?.name || '—'}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>{item.current_stock} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '400' }}>{item.unit}</span></td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{parseFloat(item.purchase_price).toFixed(2)}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{item.selling_price ? `₹${parseFloat(item.selling_price).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color, fontSize: '0.68rem', fontWeight: '700' }}>
                            {stat}
                          </span>
                        </td>
                        <td style={{ padding: '5px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => handleOpenEditItem(item)} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer' }}><FiEdit2 size={13} /></button>
                            <button onClick={() => handleDeleteItem(item.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}><FiTrash2 size={13} /></button>
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

      {/* STOCK IN TAB */}
      {activeTab === 'stock-in' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><FiPlus /> Record Stock In</h3>
          <form onSubmit={handleStockInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Date *</label>
                <input required type="date" value={stockInForm.date} onChange={e => setStockInForm(f => ({ ...f, date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Stock In Reason *</label>
                <select value={stockInForm.reason} onChange={e => setStockInForm(f => ({ ...f, reason: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  {REASONS_STOCK_IN.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Select Item *</label>
              <select required value={stockInForm.item_id} onChange={e => {
                const item = items.find(i => i.id === parseInt(e.target.value));
                setStockInForm(f => ({ ...f, item_id: e.target.value, purchase_price: item ? item.purchase_price : '' }));
              }} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                <option value="">-- Choose Inventory Item --</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku}) - Current Stock: {i.current_stock}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Quantity to Add *</label>
                <input required type="number" min="1" value={stockInForm.quantity} onChange={e => setStockInForm(f => ({ ...f, quantity: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. 10" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Purchase Price (Optional Override)</label>
                <input type="number" min="0" step="any" value={stockInForm.purchase_price} onChange={e => setStockInForm(f => ({ ...f, purchase_price: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Unit Cost Price" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Supplier</label>
                <select value={stockInForm.supplier_id} onChange={e => setStockInForm(f => ({ ...f, supplier_id: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Invoice / Bill Number</label>
                <input value={stockInForm.invoice_no} onChange={e => setStockInForm(f => ({ ...f, invoice_no: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="INV-2026-xxx" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Batch Number</label>
                <input value={stockInForm.batch_number} onChange={e => setStockInForm(f => ({ ...f, batch_number: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="BATCH-xxx" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Expiry Date</label>
                <input type="date" value={stockInForm.expiry_date} onChange={e => setStockInForm(f => ({ ...f, expiry_date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Branch</label>
                <input value={stockInForm.branch} onChange={e => setStockInForm(f => ({ ...f, branch: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Branch Location" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Upload Purchase Bill (JPG, PNG, PDF)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setStockInReceipt(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
              </div>
            </div>

            {stockInForm.reason === 'Purchase' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input type="checkbox" id="add_to_expenses" checked={stockInForm.add_to_expenses} onChange={e => setStockInForm(f => ({ ...f, add_to_expenses: e.target.checked }))} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <label htmlFor="add_to_expenses" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Automatically record as Gym Expense (Category: Inventory Purchase)</label>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Notes</label>
              <textarea rows="2" value={stockInForm.notes} onChange={e => setStockInForm(f => ({ ...f, notes: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }} placeholder="Additional notes..." />
            </div>

            <button type="submit" style={{ padding: '9px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>Record Stock In</button>
          </form>
        </div>
      )}

      {/* STOCK OUT TAB */}
      {activeTab === 'stock-out' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><FiMinus /> Record Stock Out</h3>
          <form onSubmit={handleStockOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Date *</label>
                <input required type="date" value={stockOutForm.date} onChange={e => setStockOutForm(f => ({ ...f, date: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Stock Out Reason *</label>
                <select value={stockOutForm.reason} onChange={e => setStockOutForm(f => ({ ...f, reason: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  {REASONS_STOCK_OUT.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Select Item *</label>
              <select required value={stockOutForm.item_id} onChange={e => setStockOutForm(f => ({ ...f, item_id: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                <option value="">-- Choose Inventory Item --</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku}) - Available Stock: {i.current_stock}</option>)}
              </select>
            </div>

            {stockOutForm.item_id && (
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                {(() => {
                  const item = items.find(i => i.id === parseInt(stockOutForm.item_id));
                  if (!item) return null;
                  const qty = parseInt(stockOutForm.quantity) || 0;
                  const rem = item.current_stock - qty;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Current Stock: <b>{item.current_stock}</b></span>
                      <span>Stock Out: <b>{qty}</b></span>
                      <span style={{ color: rem < 0 ? '#dc2626' : '#16a34a' }}>Remaining Stock: <b>{rem >= 0 ? rem : 'Invalid Qty'}</b></span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Quantity to Deduct *</label>
                <input required type="number" min="1" value={stockOutForm.quantity} onChange={e => setStockOutForm(f => ({ ...f, quantity: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. 2" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Reference / Receipt No.</label>
                <input value={stockOutForm.reference} onChange={e => setStockOutForm(f => ({ ...f, reference: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Bill No / Sold Invoice" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Branch</label>
              <input value={stockOutForm.branch} onChange={e => setStockOutForm(f => ({ ...f, branch: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Branch Location" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Notes</label>
              <textarea rows="3" value={stockOutForm.notes} onChange={e => setStockOutForm(f => ({ ...f, notes: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }} placeholder="Reason description..." />
            </div>

            <button type="submit" style={{ padding: '9px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>Record Stock Out</button>
          </form>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '', notes: '', status: 'active' }); setShowSupplierModal(true); }}
              style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><FiPlus /> Add Supplier</button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Supplier Name</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Contact Person</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Mobile Number</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>GST Number</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Total Purchases</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{s.name}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{s.contact_person || '—'}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{s.phone}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{s.email || '—'}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{s.gst_number || '—'}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{(s.total_purchases || 0).toLocaleString()}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', background: s.status === 'active' ? '#dcfce7' : '#fee2e2', color: s.status === 'active' ? '#16a34a' : '#dc2626', fontSize: '0.68rem', fontWeight: '700' }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => { setEditingSupplier(s); setSupplierForm(s); setShowSupplierModal(true); }} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer' }}><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDeleteSupplier(s.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', status: 'active' }); setShowCategoryModal(true); }}
              style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><FiPlus /> Add Category</button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', maxWidth: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Category Name</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '150px' }}>Status</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  <tr key={c.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{c.name}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', background: c.status === 'active' ? '#dcfce7' : '#fee2e2', color: c.status === 'active' ? '#16a34a' : '#dc2626', fontSize: '0.68rem', fontWeight: '700' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => { setEditingCategory(c); setCategoryForm(c); setShowCategoryModal(true); }} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer' }}><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDeleteCategory(c.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK HISTORY TAB */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* History Filters */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={historyFilters.item_id}
              onChange={e => setHistoryFilters(f => ({ ...f, item_id: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151', flex: 1 }}
            >
              <option value="">All Items</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>

            <select
              value={historyFilters.type}
              onChange={e => setHistoryFilters(f => ({ ...f, type: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            >
              <option value="">All Movement Types</option>
              <option value="Stock In">Stock In (+)</option>
              <option value="Stock Out">Stock Out (-)</option>
            </select>

            <input
              type="date"
              value={historyFilters.date_from}
              onChange={e => setHistoryFilters(f => ({ ...f, date_from: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            />

            <input
              type="date"
              value={historyFilters.date_to}
              onChange={e => setHistoryFilters(f => ({ ...f, date_to: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#f9fafb', color: '#374151' }}
            />

            <button onClick={handleApplyHistoryFilters} style={{ padding: '7px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
            <button onClick={handleClearHistoryFilters} style={{ padding: '7px 10px', background: 'transparent', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer' }}>Clear</button>
          </div>

          {/* Ledger Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Stock Movement History <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '400' }}>({historyTotal} entries)</span></h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Page {historyPage} of {historyLastPage}</span>
                <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}><FiChevronLeft /></button>
                <button onClick={() => setHistoryPage(p => Math.min(historyLastPage, p + 1))} disabled={historyPage === historyLastPage} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}><FiChevronRight /></button>
              </div>
            </div>

            {historyLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No movements recorded in history.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Date & Time</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Txn ID</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Item Name</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '90px' }}>Type</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '80px' }}>Quantity</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '90px' }}>Prev Stock</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase', width: '90px' }}>New Stock</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Reason</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Ref / Bill No</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.68rem', textTransform: 'uppercase' }}>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={h.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleString('en-GB')}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#64748b' }}>TXN-{1000 + h.id}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                        <div>{h.item?.name || '—'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{h.item?.sku}</div>
                      </td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: h.type === 'Stock In' ? '#dcfce7' : '#fee2e2', color: h.type === 'Stock In' ? '#16a34a' : '#dc2626', fontSize: '0.68rem', fontWeight: '700' }}>
                          {h.type}
                        </span>
                      </td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: h.type === 'Stock In' ? '#16a34a' : '#dc2626' }}>
                        {h.type === 'Stock In' ? `+${h.quantity}` : `-${h.quantity}`}
                      </td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>{h.prev_stock}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '600' }}>{h.new_stock}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#475569' }}>{h.reason}</span>
                        {h.notes && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{h.notes}</div>}
                      </td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>
                        {h.reference || '—'}
                        {h.receipt_path && (
                          <div style={{ fontSize: '0.68rem' }}><a href={h.receipt_path} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>View Bill</a></div>
                        )}
                      </td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', color: '#64748b' }}>{h.created_by || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Controls */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}>
                <option value="current_stock">Current Stock Report</option>
                <option value="low_stock">Low Stock Report</option>
                <option value="out_of_stock">Out of Stock Report</option>
                <option value="expiry">Expiry Report</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Branch Filtering</label>
              <input value={reportBranch} onChange={e => setReportBranch(e.target.value)} placeholder="Branch name" style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', width: '120px' }} />
            </div>

            {reportType === 'expiry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b' }}>Expiry Status</label>
                <select value={reportExpiryStatus} onChange={e => setReportExpiryStatus(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}>
                  <option value="">All Expiries</option>
                  <option value="Expired">Expired</option>
                  <option value="Expiring Soon">Expiring Soon (30d)</option>
                </select>
              </div>
            )}

            <button onClick={fetchReportData} style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '16px' }}>Generate</button>
            
            <div style={{ width: '1px', height: '28px', background: '#e5e7eb', marginLeft: '10px' }} />

            <button onClick={exportReportCSV} disabled={reportData.length === 0} style={{ padding: '7px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiDownload /> CSV</button>
            <button onClick={exportReportPDF} disabled={reportData.length === 0} style={{ padding: '7px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiFileText /> Print PDF</button>
          </div>

          {/* Report Data Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {reportLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Generating report...</div>
            ) : reportData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No data matching the report parameters.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>SKU</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Current Stock</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Purchase Price</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Selling Price</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{r.sku}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{r.name}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{r.category?.name || '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700' }}>{r.current_stock} {r.unit}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{parseFloat(r.purchase_price).toFixed(2)}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{r.selling_price ? `₹${parseFloat(r.selling_price).toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>{r.expiry_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- DRAWER/MODAL: ADD / EDIT ITEM --- */}
      {showItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '90%', maxWidth: '1000px', height: '90vh', maxHeight: '720px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h3>
              <button onClick={() => setShowItemModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveItem} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100% - 55px)', overflowY: 'auto' }}>
              
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0 }}>Basic Information</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Item Name *</label>
                  <input required value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Whey Protein 1KG" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Item Code / SKU *</label>
                  <input required value={itemForm.sku} onChange={e => setItemForm(f => ({ ...f, sku: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Category *</label>
                  <select required value={itemForm.category_id} onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Brand</label>
                  <input value={itemForm.brand} onChange={e => setItemForm(f => ({ ...f, brand: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. Optimum Nutrition" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Product Image</label>
                  <input type="file" accept="image/*" onChange={e => setItemImageFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Description</label>
                  <input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Optional notes" />
                </div>
              </div>

              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '6px 0 0 0' }}>Stock Information</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Opening Stock *</label>
                  <input required disabled={!!editingItem} type="number" min="0" value={itemForm.opening_stock} onChange={e => setItemForm(f => ({ ...f, opening_stock: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Unit *</label>
                  <select required value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Reorder Level</label>
                  <input type="number" min="0" value={itemForm.reorder_level} onChange={e => setItemForm(f => ({ ...f, reorder_level: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
              </div>

              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '6px 0 0 0' }}>Pricing</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Purchase Price *</label>
                  <input required type="number" min="0" step="any" value={itemForm.purchase_price} onChange={e => setItemForm(f => ({ ...f, purchase_price: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="₹ 0.00" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Selling Price</label>
                  <input type="number" min="0" step="any" value={itemForm.selling_price} onChange={e => setItemForm(f => ({ ...f, selling_price: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="₹ 0.00" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Tax / GST %</label>
                  <input type="number" min="0" value={itemForm.tax_percent} onChange={e => setItemForm(f => ({ ...f, tax_percent: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="e.g. 18%" />
                </div>
              </div>

              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '6px 0 0 0' }}>Supplier & Location</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Supplier</label>
                  <select value={itemForm.supplier_id} onChange={e => setItemForm(f => ({ ...f, supplier_id: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Purchase Date</label>
                  <input type="date" value={itemForm.purchase_date} onChange={e => setItemForm(f => ({ ...f, purchase_date: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Batch Number</label>
                  <input value={itemForm.batch_number} onChange={e => setItemForm(f => ({ ...f, batch_number: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="BATCH-xxx" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Expiry Date</label>
                  <input type="date" value={itemForm.expiry_date} onChange={e => setItemForm(f => ({ ...f, expiry_date: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Storage Location</label>
                  <input value={itemForm.location} onChange={e => setItemForm(f => ({ ...f, location: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Shelf A / Cabinet B" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Branch</label>
                  <input value={itemForm.branch} onChange={e => setItemForm(f => ({ ...f, branch: e.target.value }))} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Main Branch" />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowItemModal(false)} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                {!editingItem && <button type="button" onClick={(e) => handleSaveItem(e, true)} style={{ padding: '8px 14px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Save & Add Another</button>}
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DRAWER/MODAL: ADD / EDIT SUPPLIER --- */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setShowSupplierModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveSupplier} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Supplier Name *</label>
                <input required value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Supplier Company Name" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Contact Person</label>
                  <input value={supplierForm.contact_person} onChange={e => setSupplierForm(f => ({ ...f, contact_person: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Agent Name" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Phone Number *</label>
                  <input required value={supplierForm.phone} onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Mobile / Phone" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Email</label>
                  <input type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="email@vendor.com" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>GST Number</label>
                  <input value={supplierForm.gst_number} onChange={e => setSupplierForm(f => ({ ...f, gst_number: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="GSTIN" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Address</label>
                <input value={supplierForm.address} onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Full street address" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Supplier Status</label>
                <select value={supplierForm.status} onChange={e => setSupplierForm(f => ({ ...f, status: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Notes</label>
                <textarea rows="2" value={supplierForm.notes} onChange={e => setSupplierForm(f => ({ ...f, notes: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }} placeholder="Additional notes..." />
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowSupplierModal(false)} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DRAWER/MODAL: ADD / EDIT CATEGORY --- */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', width: '380px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveCategory} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Category Name *</label>
                <input required value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }} placeholder="Category Name" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>Status</label>
                <select value={categoryForm.status} onChange={e => setCategoryForm(f => ({ ...f, status: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', background: '#fff' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventorySection;
