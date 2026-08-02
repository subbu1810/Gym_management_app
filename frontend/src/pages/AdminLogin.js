import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, gymsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope, 
  FaPhone, FaMapMarkerAlt, FaUsers, FaCheckSquare, 
  FaFileInvoiceDollar, FaChartBar, FaDumbbell 
} from 'react-icons/fa';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Gym Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [gymName, setGymName] = useState('');
  const [gymEmail, setGymEmail] = useState('');
  const [gymPhone, setGymPhone] = useState('');
  const [gymAddress, setGymAddress] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

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
        if (res.role === 'super_admin') {
          navigate('/super-admin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        toast.error('Login failed. No token received.');
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleRegisterGym = async (e) => {
    e.preventDefault();
    try {
      await gymsAPI.registerGym({
        name: gymName,
        email: gymEmail,
        phone: gymPhone,
        address: gymAddress,
        admin_username: adminUsername,
        admin_password: adminPassword
      });
      toast.success('Gym registered successfully! You can now log in.');
      setIsRegistering(false);
      setUsername(adminUsername);
      setPassword(adminPassword);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register gym.');
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

  const renderForm = () => {
    if (isForgotPassword) {
      return (
        <>
          <h2>Reset Password</h2>
          <p>Recover access to your dashboard</p>
          {resetStage === 1 || resetStage === 2 ? (
            <form onSubmit={resetStage === 1 ? handleRequestOtp : handleVerifyOtp}>
              <div className="mockupInputGroup">
                <label>Email Address</label>
                <div className="mockupInputWrapper">
                  <FaEnvelope className="inputIcon" />
                  <input
                    type="text"
                    className="mockupInput"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                    required
                    disabled={resetStage === 2}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              <div className="mockupInputGroup">
                <label>OTP Code</label>
                <div className="mockupInputWrapper">
                  <FaLock className="inputIcon" />
                  <input
                    type="text"
                    className="mockupInput"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required={resetStage === 2}
                    disabled={resetStage === 1}
                    placeholder={resetStage === 1 ? 'Enter email to receive OTP' : 'Enter 6-digit OTP'}
                  />
                </div>
              </div>
              
              {resetStage === 2 && (
                <div style={{ marginBottom: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
                  {timer > 0 ? (
                    <span style={{ color: '#a0a0a0' }}>
                      Resend OTP in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  ) : (
                    <span
                      onClick={handleRequestOtp}
                      style={{ color: '#ff5533', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Resend OTP
                    </span>
                  )}
                </div>
              )}

              <button type="submit" className="mockupBtn" disabled={resetStage === 2 && timer === 0}>
                {resetStage === 1 ? 'Send OTP' : 'Verify OTP'}
              </button>
              <div className="formFooter">
                <span className="link" onClick={() => { setIsForgotPassword(false); setResetStage(1); }}>Back to Login</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="mockupInputGroup">
                <label>Email Address</label>
                <div className="mockupInputWrapper">
                  <FaEnvelope className="inputIcon" />
                  <input type="text" className="mockupInput" value={identifier} disabled />
                </div>
              </div>
              <div className="mockupInputGroup">
                <label>New Password</label>
                <div className="mockupInputWrapper">
                  <FaLock className="inputIcon" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="mockupInput"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                  />
                  <span className="passwordToggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
              </div>
              <div className="mockupInputGroup">
                <label>Confirm Password</label>
                <div className="mockupInputWrapper">
                  <FaLock className="inputIcon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="mockupInput"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                  />
                  <span className="passwordToggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
              </div>
              <button type="submit" className="mockupBtn">Reset Password</button>
              <div className="formFooter">
                <span className="link" onClick={() => { setIsForgotPassword(false); setResetStage(1); }}>Cancel</span>
              </div>
            </form>
          )}
        </>
      );
    }

    if (isRegistering) {
      return (
        <>
          <h2>Register Gym</h2>
          <p>Create your management dashboard</p>
          <form onSubmit={handleRegisterGym}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="mockupInputGroup">
                <label>Gym Name</label>
                <div className="mockupInputWrapper">
                  <FaDumbbell className="inputIcon" />
                  <input type="text" className="mockupInput" value={gymName} onChange={(e) => setGymName(e.target.value)} required />
                </div>
                </div>
                <div className="mockupInputGroup">
                <label>Email</label>
                <div className="mockupInputWrapper">
                  <FaEnvelope className="inputIcon" />
                  <input type="email" className="mockupInput" value={gymEmail} onChange={(e) => setGymEmail(e.target.value)} required />
                </div>
                </div>
            </div>
            <div className="mockupInputGroup">
              <label>Phone</label>
              <div className="mockupInputWrapper">
                <FaPhone className="inputIcon" />
                <input type="text" className="mockupInput" value={gymPhone} onChange={(e) => setGymPhone(e.target.value)} required />
              </div>
            </div>
            <div className="mockupInputGroup">
              <label>Address</label>
              <div className="mockupInputWrapper">
                <FaMapMarkerAlt className="inputIcon" />
                <input type="text" className="mockupInput" value={gymAddress} onChange={(e) => setGymAddress(e.target.value)} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="mockupInputGroup">
                <label>Admin Username</label>
                <div className="mockupInputWrapper">
                  <FaUser className="inputIcon" />
                  <input type="text" className="mockupInput" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} required />
                </div>
                </div>
                <div className="mockupInputGroup">
                <label>Admin Password</label>
                <div className="mockupInputWrapper">
                  <FaLock className="inputIcon" />
                  <input
                      type={showPassword ? "text" : "password"}
                      className="mockupInput"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                  />
                  <span className="passwordToggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
                </div>
            </div>
            <button type="submit" className="mockupBtn" style={{ marginTop: '10px' }}>Create Gym</button>
            <div className="formFooter">
              Already have a gym? <span className="link" onClick={() => setIsRegistering(false)}>Log in</span>
            </div>
          </form>
        </>
      );
    }

    return (
      <>
        <h2>Welcome Back!</h2>
        <p>Login to access your dashboard</p>
        <form onSubmit={handleLogin}>
          <div className="mockupInputGroup">
            <label>Username</label>
            <div className="mockupInputWrapper">
              <FaUser className="inputIcon" />
              <input 
                type="text" 
                className="mockupInput" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="admin"
              />
            </div>
          </div>
          <div className="mockupInputGroup" style={{ marginBottom: '16px' }}>
            <label>Password</label>
            <div className="mockupInputWrapper">
              <FaLock className="inputIcon" />
              <input
                type={showPassword ? "text" : "password"}
                className="mockupInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <span className="passwordToggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>
          
          <div className="formOptions">
            <label className="rememberMe">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
            <span className="forgotLink" onClick={() => setIsForgotPassword(true)}>Forgot Password?</span>
          </div>

          <button type="submit" className="mockupBtn">Login</button>
          
          <div className="formFooter">
            Don't have an account? <span className="link" onClick={() => setIsRegistering(true)}>Register New Gym</span>
          </div>
        </form>
      </>
    );
  };

  return (
    <div 
      className="loginSplitContainer" 
      style={{ backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%), url('/images/login_bg.png')" }}
    >
      {/* ── LEFT SIDE: Mockup Branding & Features ── */}
      <div className="loginLeft">
        <div className="loginBrandTop">
          <FaDumbbell size={40} className="brandIcon" />
          <div className="brandText">
            <span className="brandTitle">POWER GYM</span>
            <span className="brandSubtitle">Management System</span>
          </div>
        </div>

        <div className="loginHeroContent">
          <h1>Power Your Gym.<br/>Manage <span>Everything.</span></h1>
          <p>The all-in-one platform to manage members, attendance, trainers, billing and grow your fitness business.</p>
        </div>

        <div className="featureGrid">
          <div className="featureItem">
            <FaUsers size={28} />
            <span>Members<br/>Management</span>
          </div>
          <div className="featureItem">
            <FaCheckSquare size={28} />
            <span>Smart<br/>Attendance</span>
          </div>
          <div className="featureItem">
            <FaFileInvoiceDollar size={28} />
            <span>Easy<br/>Billing</span>
          </div>
          <div className="featureItem">
            <FaChartBar size={28} />
            <span>Powerful<br/>Reports</span>
          </div>
        </div>
      </div>
      
      {/* ── RIGHT SIDE: Mockup Form Card ── */}
      <div className="loginRight">
        <div className="mockupFormCard">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
