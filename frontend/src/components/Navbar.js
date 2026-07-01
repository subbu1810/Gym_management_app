import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [gymName, setGymName] = useState(localStorage.getItem('gymName') || 'GymBooking');
  const [gymLogo, setGymLogo] = useState(localStorage.getItem('gymLogo') || '');

  useEffect(() => {
    const handleUpdate = () => {
      setGymName(localStorage.getItem('gymName') || 'GymBooking');
      setGymLogo(localStorage.getItem('gymLogo') || '');
    };
    window.addEventListener('gymSettingsUpdated', handleUpdate);
    return () => window.removeEventListener('gymSettingsUpdated', handleUpdate);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 40px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {gymLogo && <img src={gymLogo} alt="Gym Logo" style={{ height: '30px', objectFit: 'contain' }} />}
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {gymName}
          </h1>
        </Link>
      </div>
      <div>
        {isAuthenticated && (
          <>
            <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
