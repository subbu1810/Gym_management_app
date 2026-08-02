import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import LandingPage from './pages/LandingPage';
import BookingForm from './pages/Reister';
import BookingSuccess from './pages/BookingSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Terms from './pages/terms';
import Payment from './pages/payment';
import CheckInPage from './pages/CheckInPage';

import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import SuperAdminGyms from './pages/super-admin/SuperAdminGyms';

const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin/dashboard');
  const isLanding = location.pathname === '/';
  const isAdminLogin = location.pathname === '/admin' || location.pathname === '/login';
  const isCheckIn = location.pathname.startsWith('/checkin');
  const isSuperAdmin = location.pathname.startsWith('/super-admin');
  const hideNavbar = isDashboard || isLanding || isAdminLogin || isCheckIn || isSuperAdmin;

  useEffect(() => {
    const savedTheme = localStorage.getItem('isDarkMode');
    const isDark = savedTheme !== null ? JSON.parse(savedTheme) : true;
    if (!isDark) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, []);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {!hideNavbar && <Navbar />}
      <div style={{ minHeight: hideNavbar ? '100vh' : 'calc(100vh - 80px)', padding: 0, margin: 0 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookingForm />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/checkin/:gymId" element={<CheckInPage />} />
          <Route path="/success" element={<BookingSuccess />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* SUPER ADMIN ROUTES */}
          <Route path="/super-admin" element={<ProtectedRoute requireSuperAdmin={true}><SuperAdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="gyms" element={<SuperAdminGyms />} />
          </Route>
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
