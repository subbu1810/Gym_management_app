import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
      // If we are on an admin route, redirect to login
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

export const bookingsAPI = {
  getAll: (filters = {}) => api.get('/bookings', { params: filters }).then(r => r.data).catch(e => { console.error("Error fetching bookings:", e); return []; }),
  getById: (id) => api.get(`/bookings/${id}`).then(r => r.data),
  create: (data) => api.post('/bookings', data).then(r => r.data),
  update: (id, data) => api.put(`/bookings/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/bookings/${id}`).then(r => r.data)
};

export const paymentsAPI = {
  createOrder: (data) => api.post('/payment/create-order', data).then(r => r.data),
  verify: (data) => api.post('/payment/verify', data).then(r => r.data)
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats').then(r => r.data)
};

export const settingsAPI = {
  getSettings: () => api.get('/settings').then(r => {
    if (r.data.success) return r.data.settings;
    throw new Error('Failed to fetch settings');
  }),
  updateSettings: (settingsData) => api.put('/settings', settingsData).then(r => r.data)
};

export default api;
