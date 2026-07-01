import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/global.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = (e) => {
    e.preventDefault();
    try {
      if (username === 'admin' && password === 'admin123') {
        login('dummy-jwt-token-12345');
        toast.success('Logged in successfully!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

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
            style={{
              position: 'absolute',
              right: '15px',
              top: '42px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none'
            }}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>
        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
