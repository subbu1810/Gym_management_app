import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized access. Token might be invalid or expired. Logging out...");
      localStorage.removeItem('token');
      if (window.location.pathname.includes('admin')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

// --- REST API Endpoint Integrations ---

export const authAPI = {
  adminLogin: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
  requestAdminOtp: (data) => api.post('/auth/forgot-password/request-otp', data).then(r => r.data),
  verifyAdminOtp: (data) => api.post('/auth/forgot-password/verify-otp', data).then(r => r.data),
  resetAdminPassword: (data) => api.post('/auth/forgot-password/reset', data).then(r => r.data)
};

export const paymentsAPI = {
  createOrder: (data) => api.post('/payment/create-order', data).then(r => r.data),
  verify: (data) => api.post('/payment/verify', data).then(r => r.data),
  getAll: () => api.get('/payments-crud').then(r => r.data),
  create: (data) => api.post('/payments-crud', data).then(r => r.data),
  update: (id, data) => api.put(`/payments-crud/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/payments-crud/${id}`).then(r => r.data)
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats').then(r => r.data),
  getDashboardInit: () => api.get('/admin/dashboard-init').then(r => r.data),
  getRevenueReport: () => api.get('/admin/reports/revenue').then(r => r.data),
  getMembershipReport: (params = {}) => api.get('/admin/reports/membership', { params }).then(r => r.data),
  getAttendanceReport: (params = {}) => api.get('/admin/reports/attendance', { params }).then(r => r.data),
  getTrainerReport: (params = {}) => api.get('/admin/reports/trainer', { params }).then(r => r.data),
  getWorkoutReport: (params = {}) => api.get('/admin/reports/workout', { params }).then(r => r.data),
  getPaymentReport: (params = {}) => api.get('/admin/reports/payment', { params }).then(r => r.data)
};

export const settingsAPI = {
  getSettings: () => api.get('/gym/settings').then(r => r.data),
  updateSettings: (data) => api.post('/gym/settings', data).then(r => r.data),
  updateLogo: (data) => api.post('/gym/settings/logo', data).then(r => r.data),
  updateNotifications: (data) => api.post('/gym/settings/notifications', data).then(r => r.data),
  updatePayments: (data) => api.post('/gym/settings/payments', data).then(r => r.data),
  updateTax: (data) => api.post('/gym/settings/tax', data).then(r => r.data),
  updateIntegrations: (data) => api.post('/gym/settings/integrations', data).then(r => r.data),
  createWalletOrder: (data) => api.post('/gym/settings/wallet/create-order', data).then(r => r.data),
  verifyWalletRecharge: (data) => api.post('/gym/settings/wallet/verify-recharge', data).then(r => r.data),
  getWalletTransactions: () => api.get('/gym/settings/wallet/transactions').then(r => r.data)
};

export const gymsAPI = {
  registerGym: (data) => api.post('/gyms/register', data).then(r => r.data),
  getGyms: () => api.get('/gyms').then(r => r.data)
};

export const membersAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get('/members', { params: filters });
      return response.data;
    } catch (e) {
      console.error("Error fetching members:", e);
      return [];
    }
  },
  getById: async (id) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/members', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.post(`/members/${id}?_method=PUT`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  }
};
export const trainersAPI = {
  getAll: async () => {
    const response = await api.get('/trainers');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/trainers', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/trainers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/trainers/${id}`);
    return response.data;
  }
};

export const plansAPI = {
  getAll: () => api.get('/plans').then(r => r.data),
  create: (data) => api.post('/plans', data).then(r => r.data),
  update: (id, data) => api.put(`/plans/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/plans/${id}`).then(r => r.data)
};

export const attendanceAPI = {
  getAll: () => api.get('/attendances').then(r => r.data),
  create: (data) => api.post('/attendances', data).then(r => r.data),
  update: (id, data) => api.put(`/attendances/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/attendances/${id}`).then(r => r.data)
};

export const expensesAPI = {
  getAll: (params = {}) => api.get('/expenses', { params }).then(r => r.data),
  create: (data) => api.post('/expenses', data).then(r => r.data),
  update: (id, data) => api.post(`/expenses/${id}?_method=PUT`, data).then(r => r.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(r => r.data)
};

export const inventoryAPI = {
  getDashboard: () => api.get('/inventory/dashboard').then(r => r.data),
  getItems: (params = {}) => api.get('/inventory/items', { params }).then(r => r.data),
  createItem: (data) => api.post('/inventory/items', data).then(r => r.data),
  updateItem: (id, data) => api.post(`/inventory/items/${id}?_method=PUT`, data).then(r => r.data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}`).then(r => r.data),
  stockIn: (data) => api.post('/inventory/stock-in', data).then(r => r.data),
  stockOut: (data) => api.post('/inventory/stock-out', data).then(r => r.data),
  getHistory: (params = {}) => api.get('/inventory/history', { params }).then(r => r.data),
  getCategories: () => api.get('/inventory/categories').then(r => r.data),
  createCategory: (data) => api.post('/inventory/categories', data).then(r => r.data),
  updateCategory: (id, data) => api.put(`/inventory/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}`).then(r => r.data),
  getSuppliers: () => api.get('/inventory/suppliers').then(r => r.data),
  createSupplier: (data) => api.post('/inventory/suppliers', data).then(r => r.data),
  updateSupplier: (id, data) => api.put(`/inventory/suppliers/${id}`, data).then(r => r.data),
  deleteSupplier: (id) => api.delete(`/inventory/suppliers/${id}`).then(r => r.data),
  getReports: (params = {}) => api.get('/inventory/reports', { params }).then(r => r.data),
  getSalesReport: (params = {}) => api.get('/inventory/sales-report', { params }).then(r => r.data)
};

export const equipmentAPI = {
  getDashboard: () => api.get('/equipment/dashboard').then(r => r.data),
  getItems: (params = {}) => api.get('/equipment/items', { params }).then(r => r.data),
  createItem: (data) => api.post('/equipment/items', data).then(r => r.data),
  updateItem: (id, data) => api.post(`/equipment/items/${id}?_method=PUT`, data).then(r => r.data),
  deleteItem: (id) => api.delete(`/equipment/items/${id}`).then(r => r.data),
  addMaintenance: (data) => api.post('/equipment/maintenance', data).then(r => r.data),
  getServiceHistory: (params = {}) => api.get('/equipment/service-history', { params }).then(r => r.data),
  getReports: (params = {}) => api.get('/equipment/reports', { params }).then(r => r.data),
  getCategories: () => api.get('/equipment/categories').then(r => r.data),
  createCategory: (data) => api.post('/equipment/categories', data).then(r => r.data),
  updateCategory: (id, data) => api.put(`/equipment/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id) => api.delete(`/equipment/categories/${id}`).then(r => r.data)
};

export const backupAPI = {
  getAll: () => api.get('/backups').then(r => r.data),
  create: () => api.post('/backups').then(r => r.data),
  restore: (filename) => api.post('/backups/restore', { filename }).then(r => r.data),
  upload: (data) => api.post('/backups/upload', data).then(r => r.data),
  delete: (filename) => api.delete(`/backups/${filename}`).then(r => r.data),
  downloadUrl: (filename) => `${API_URL}/backups/download/${filename}?token=${localStorage.getItem('token')}`
};

export const superAdminAPI = {
  getGyms: () => api.get('/super-admin/gyms').then(r => r.data),
  updateSubscription: (id, data) => api.put(`/super-admin/gyms/${id}/subscription`, data).then(r => r.data),
  updateWallet: (id, data) => api.put(`/super-admin/gyms/${id}/wallet`, data).then(r => r.data)
};

export const logsAPI = {
  getAll: (params = {}) => api.get('/system-logs', { params }).then(r => r.data),
  clear: () => api.delete('/system-logs').then(r => r.data),
  downloadUrl: () => `${API_URL}/system-logs/download?token=${localStorage.getItem('token')}`
};

export default api;
