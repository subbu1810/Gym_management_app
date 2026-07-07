import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/global.css';

const AdminLogin = () => {
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStage, setResetStage] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(180);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const wasLightMode = document.body.classList.contains('light-mode');
    document.body.classList.add('light-mode');

    return () => {
      if (!wasLightMode) {
        document.body.classList.remove('light-mode');
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (resetStage === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resetStage, timer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.adminLogin({ username, password });
      if (res && res.token) {
        login(res.token);
        toast.success('Logged in successfully!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Login failed. No token received.');
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(identifier)) {
      return toast.error('Please enter a valid email address.');
    }

    try {
      await authAPI.requestAdminOtp({ identifier });
      toast.success('OTP sent successfully!');
      setTimer(180);
      setResetStage(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await authAPI.verifyAdminOtp({ identifier, otp });
      toast.success('OTP verified!');
      setResetStage(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    try {
      await authAPI.resetAdminPassword({ identifier, otp, newPassword });
      toast.success('Password reset successfully! You can now log in.');
      setIsForgotPassword(false);
      setResetStage(1);
      setIdentifier('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value.toLowerCase());
  };

  if (isForgotPassword) {
    return (
      <div className="container form-container">
        <h2>Reset Password</h2>
        {resetStage === 1 || resetStage === 2 ? (
          <form onSubmit={resetStage === 1 ? handleRequestOtp : handleVerifyOtp}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="text"
                value={identifier}
                onChange={handleIdentifierChange}
                required
                disabled={resetStage === 2}
              />
            </div>
            <div className="form-group">
              <label>OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required={resetStage === 2}
                disabled={resetStage === 1}
                placeholder={resetStage === 1 ? 'Enter identifier to receive OTP' : 'Enter 6-digit OTP'}
              />
            </div>
            <button type="submit" className="btn" disabled={resetStage === 2 && timer === 0}>
              {resetStage === 1 ? 'Send OTP' : 'Verify OTP'}
            </button>

            {resetStage === 2 && (
              <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.9rem' }}>
                {timer > 0 ? (
                  <span style={{ color: '#555' }}>
                    Resend OTP in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                  </span>
                ) : (
                  <span
                    onClick={handleRequestOtp}
                    style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Resend OTP
                  </span>
                )}
              </div>
            )}

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <span
                onClick={() => { setIsForgotPassword(false); setResetStage(1); }}
                style={{ color: '#007bff', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Back to Login
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="text" value={identifier} disabled />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
              <span
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: '15px', top: '42px', cursor: 'pointer', color: '#888', fontSize: '1.2rem', display: 'flex', alignItems: 'center', userSelect: 'none' }}
              >
                {showNewPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '15px', top: '42px', cursor: 'pointer', color: '#888', fontSize: '1.2rem', display: 'flex', alignItems: 'center', userSelect: 'none' }}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <button type="submit" className="btn">Reset Password</button>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <span
                onClick={() => { setIsForgotPassword(false); setResetStage(1); }}
                style={{ color: '#007bff', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Cancel
              </span>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="container form-container">
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ paddingRight: '40px' }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '15px', top: '42px', cursor: 'pointer', color: '#888', fontSize: '1.2rem', display: 'flex', alignItems: 'center', userSelect: 'none' }}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <span
              onClick={() => setIsForgotPassword(true)}
              style={{ color: '#007bff', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Forgot Password?
            </span>
          </div>
        </div>
        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
