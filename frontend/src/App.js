import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
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
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <Navbar />
        <div style={{ minHeight: 'calc(100vh - 80px)' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book" element={<BookingForm />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/success" element={<BookingSuccess />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
