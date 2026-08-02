import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiLogOut } from 'react-icons/fi';
import { FaDumbbell } from 'react-icons/fa';
import '../../styles/AdminDashboard.css';

function SuperAdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand-new">
          <FaDumbbell size={28} color="#ff5533" />
          <div className="brand-text-new">
            <h2>POWER <span className="highlight">GYM</span></h2>
            <span className="subtitle">Super Admin</span>
          </div>
        </div>
        
        <nav className="sidebar-nav-new">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <NavLink to="/super-admin/dashboard" className={({ isActive }) => (isActive ? 'active' : '')} style={{ textDecoration: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '500', borderRadius: '8px', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s ease' }} 
                  onMouseEnter={(e) => { if(!e.currentTarget.parentElement.classList.contains('active')) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; } }}
                  onMouseLeave={(e) => { if(!e.currentTarget.parentElement.classList.contains('active')) { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
              >
                <FiGrid size={18} /> Dashboard
              </li>
            </NavLink>
            <NavLink to="/super-admin/gyms" className={({ isActive }) => (isActive ? 'active' : '')} style={{ textDecoration: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '500', borderRadius: '8px', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { if(!e.currentTarget.parentElement.classList.contains('active')) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; } }}
                  onMouseLeave={(e) => { if(!e.currentTarget.parentElement.classList.contains('active')) { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
              >
                <FiUsers size={18} /> Manage Gyms
              </li>
            </NavLink>
            {/* Inline style overrides for .active li */}
            <style>{`
              .sidebar-nav-new a.active li {
                background-color: rgba(255, 85, 51, 0.08) !important;
                color: #ff5533 !important;
                border: 1px solid rgba(255, 85, 51, 0.5) !important;
                font-weight: 600 !important;
              }
            `}</style>
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="page-title">Super Admin Panel</h1>
          <div className="topbar-actions">
            <div className="user-profile-simple">
              <div className="user-info">
                <span className="user-name">Super Admin</span>
                <span className="user-role">Platform Owner</span>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ff5533', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                SA
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default SuperAdminLayout;
