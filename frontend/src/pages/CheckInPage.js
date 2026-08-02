import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiMapPin, FiUser } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { attendanceAPI } from '../services/api';

const CheckInPage = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [loginRole, setLoginRole] = useState('member'); // 'member' or 'trainer'

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role') || localStorage.getItem('type'); // type is member or admin

    if (token && username) {
      setUser({ username, role });
    }
  }, [gymId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const endpoint = loginRole === 'trainer' ? '/api/auth/trainer-login' : '/api/auth/member-login';
      const payload = loginRole === 'trainer' 
        ? { email: loginUsername, password: loginPassword }
        : { username: loginUsername, password: loginPassword };

      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('type', data.type);
        localStorage.setItem('gymId', data.gym_id);
        setUser({ username: data.username, role: data.type });
        toast.success('Logged in successfully!');
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      const res = await attendanceAPI.create({
        date: today,
        time: now,
        method: 'QR Code'
      });
      
      if (res.success) {
        toast.success(res.message || "Attendance marked successfully!");
      } else {
        toast.error(res.message || "Failed to mark attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while marking attendance");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <Toaster />
        <div style={{ background: '#fff', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiMapPin color="#f97316" /> Check-In Gateway
          </h1>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>Login to Check In</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.95rem' }}>Please enter your details to proceed.</p>
            
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
              <button 
                onClick={() => setLoginRole('member')}
                style={{ flex: 1, padding: '8px', border: 'none', background: loginRole === 'member' ? '#fff' : 'transparent', color: loginRole === 'member' ? '#f97316' : '#64748b', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', boxShadow: loginRole === 'member' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
              >
                Member
              </button>
              <button 
                onClick={() => setLoginRole('trainer')}
                style={{ flex: 1, padding: '8px', border: 'none', background: loginRole === 'trainer' ? '#fff' : 'transparent', color: loginRole === 'trainer' ? '#f97316' : '#64748b', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', boxShadow: loginRole === 'trainer' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
              >
                Trainer
              </button>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Phone Number</label>
                  <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} placeholder="Enter registered phone number" />
               </div>
               <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Password</label>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} placeholder="Enter password" />
               </div>
               <button 
                  type="submit" 
                  disabled={loginLoading}
                  style={{ width: '100%', padding: '16px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}
               >
                  {loginLoading ? 'Logging in...' : 'Login'}
               </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Toaster />
      <div style={{ background: '#fff', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiMapPin color="#f97316" /> Check-In Gateway
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px auto' }}>
            <FiCheckCircle />
          </div>

          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>Welcome, {user.username}</h2>
          <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '0.95rem' }}>You are about to mark your attendance for today.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', textAlign: 'left', background: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiClock color="#64748b" />
                <div>
                   <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Time</div>
                   <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{new Date().toLocaleTimeString()}</div>
                </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiUser color="#64748b" />
                <div>
                   <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Method</div>
                   <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>QR Code Scan</div>
                </div>
             </div>
          </div>

          <button 
            onClick={handleCheckIn}
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: '#f97316', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Processing...' : 'Mark Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
