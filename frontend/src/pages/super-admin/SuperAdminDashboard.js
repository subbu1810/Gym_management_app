import React, { useEffect, useState } from 'react';
import { FiUsers, FiDollarSign, FiActivity } from 'react-icons/fi';
import { superAdminAPI } from '../../services/api';
import '../../styles/AdminDashboard.css';

function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalGyms: 0,
    activeGyms: 0,
    totalWalletBalance: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const gyms = await superAdminAPI.getGyms();
      
      let totalGyms = gyms.length;
      let activeGyms = gyms.filter(g => g.subscription_status === 'active').length;
      let totalWallet = gyms.reduce((sum, g) => sum + (parseFloat(g.wallet_balance) || 0), 0);

      setStats({
        totalGyms,
        activeGyms,
        totalWalletBalance: totalWallet
      });
    } catch (error) {
      console.error("Error fetching super admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading super admin dashboard...</div>;

  return (
    <div>
      <div className="stats-container">
        <div className="stat-card stat-users">
          <div className="stat-header">
            <div>
              <h3 className="stat-title">Total Gyms</h3>
              <h2 className="stat-value">{stats.totalGyms}</h2>
            </div>
            <div className="stat-icon"><FiUsers /></div>
          </div>
        </div>

        <div className="stat-card stat-revenue">
          <div className="stat-header">
            <div>
              <h3 className="stat-title">Active Subscriptions</h3>
              <h2 className="stat-value">{stats.activeGyms}</h2>
            </div>
            <div className="stat-icon"><FiActivity /></div>
          </div>
        </div>

        <div className="stat-card stat-payments">
          <div className="stat-header">
            <div>
              <h3 className="stat-title">Total Wallets Balance</h3>
              <h2 className="stat-value">₹{stats.totalWalletBalance.toLocaleString()}</h2>
            </div>
            <div className="stat-icon"><FiDollarSign /></div>
          </div>
        </div>
      </div>

      <div className="list-card" style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '16px' }}>Welcome, Super Admin</h2>
        <p style={{ color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Use the "Manage Gyms" section in the sidebar to view all registered gyms, update their subscription statuses, and manage their wallet balances for automated services like WhatsApp.
        </p>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
