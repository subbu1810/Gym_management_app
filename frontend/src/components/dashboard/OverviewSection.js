import React from 'react';
import { FiUsers, FiCalendar, FiCheckCircle, FiCreditCard, FiUserPlus, FiActivity, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import '../../styles/dashboard/OverviewSection.css';

const OverviewSection = ({ lineData, pieData, totalBookings, completedBookings, cancelledBookings, pendingBookings, m_total }) => {
  return (
    <div className="overview-layout">

      {/* TOP STATS ROW */}
      <div className="stats-container">
        <div className="stat-card stat-users">
          <div className="stat-header">
            <h3 className="stat-title">Total Members</h3>
            <div className="stat-icon"><FiUsers /></div>
          </div>
          <p className="stat-value">{m_total || 1248}</p>
          <div className="stat-trend positive">↑ 12.5% <span>vs last month</span></div>
        </div>

        <div className="stat-card stat-bookings">
          <div className="stat-header">
            <h3 className="stat-title">Total Bookings</h3>
            <div className="stat-icon"><FiCalendar /></div>
          </div>
          <p className="stat-value">{totalBookings}</p>
          <div className="stat-trend positive">↑ 8.2% <span>vs last month</span></div>
        </div>

        <div className="stat-card stat-revenue">
          <div className="stat-header">
            <h3 className="stat-title">Active Members</h3>
            <div className="stat-icon"><FiCheckCircle /></div>
          </div>
          <p className="stat-value">{completedBookings}</p>
          <div className="stat-trend positive">↑ 5.1% <span>vs last month</span></div>
        </div>

        <div className="stat-card stat-payments">
          <div className="stat-header">
            <h3 className="stat-title">Pending</h3>
            <div className="stat-icon"><FiCreditCard /></div>
          </div>
          <p className="stat-value">{pendingBookings}</p>
          <div className="stat-trend negative">↓ 2.3% <span>vs last month</span></div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="charts-container">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Bookings by Plan Type</h3>
            <select className="chart-filter"><option>This Month ⌄</option></select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '50%' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(pieData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(pieData || []).map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }}></div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>{item.name}</span>
                  </div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Booking Trend</h3>
            <select className="chart-filter"><option>This Month ⌄</option></select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <Tooltip />
              <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="Active" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Pending" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Cancelled" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="lists-container">
        <div className="list-card">
          <div className="list-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            <div className="action-card qa-1"><div className="icon-wrapper"><FiUserPlus /></div><span>Add Member</span></div>
            <div className="action-card qa-2"><div className="icon-wrapper"><FiCalendar /></div><span>New Booking</span></div>
            <div className="action-card qa-3"><div className="icon-wrapper"><FiCreditCard /></div><span>Record Payment</span></div>
            <div className="action-card qa-4"><div className="icon-wrapper"><FiCheckCircle /></div><span>Mark Attendance</span></div>
            <div className="action-card qa-5"><div className="icon-wrapper"><FiUsers /></div><span>Add Trainer</span></div>
            <div className="action-card qa-6"><div className="icon-wrapper"><FiActivity /></div><span>Create Workout</span></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OverviewSection;
