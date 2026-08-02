import React, { useEffect, useState } from 'react';
import { adminAPI, membersAPI, attendanceAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiCalendar, FiCreditCard, FiPieChart, FiSettings, FiCheckSquare, FiHome, FiLogOut, FiBell, FiChevronDown, FiBriefcase, FiUserPlus, FiActivity, FiTrendingUp, FiBox, FiShoppingCart, FiFileText, FiTool } from 'react-icons/fi';
import OverviewSection from '../components/dashboard/OverviewSection';
import MembersSection from '../components/dashboard/MembersSection';
import PaymentsSection from '../components/dashboard/PaymentsSection';
import ReportsSection from '../components/dashboard/ReportsSection';
import AttendanceSection from '../components/dashboard/AttendanceSection';
import SettingsSection from '../components/dashboard/SettingsSection';
import TrainersSettings from '../components/dashboard/settings/TrainersSettings';
import ExpensesSection from '../components/dashboard/ExpensesSection';
import InventorySection from '../components/dashboard/InventorySection';
import EquipmentSection from '../components/dashboard/EquipmentSection';
import { generateDashboardData } from '../utils/dashboardHelpers';
import '../styles/AdminDashboard.css';

console.log("Sections:", { OverviewSection, MembersSection, PaymentsSection, ReportsSection, AttendanceSection, SettingsSection, TrainersSettings, ExpensesSection, InventorySection });
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [gymData, setGymData] = useState(null);
  const [membershipReport, setMembershipReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [trainerReport, setTrainerReport] = useState(null);
  const [workoutReport, setWorkoutReport] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [theme, setTheme] = useState('light');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [activeReportsTab, setActiveReportsTab] = useState('overview');
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
  const [activeAttendanceTab, setActiveAttendanceTab] = useState('overview');
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);
  const [activePaymentsTab, setActivePaymentsTab] = useState('overview');

  const [gymNameInput, setGymNameInput] = useState(localStorage.getItem('gymName') || 'POWER GYM');
  const [gymLogoInput, setGymLogoInput] = useState(localStorage.getItem('gymLogo') || '');

  useEffect(() => {
    if (memberSearch === '') {
      fetchDashboardInit();
      fetchPayments();
      fetchReports();
    } else {
      fetchMembers();
    }
  }, [memberSearch]);

  const fetchPayments = async () => {
    try {
      const data = await paymentsAPI.getAll();
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const [rev, mem, att, trn, wrk] = await Promise.all([
        adminAPI.getRevenueReport(),
        adminAPI.getMembershipReport(),
        adminAPI.getAttendanceReport(),
        adminAPI.getTrainerReport(),
        adminAPI.getWorkoutReport()
      ]);
      if (rev.success) setRevenueReport(rev.data);
      if (mem.success) setMembershipReport(mem.data);
      if (att.success) setAttendanceReport(att.data);
      if (trn.success) setTrainerReport(trn.data);
      if (wrk.success) setWorkoutReport(wrk.data);
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    }
  };

  const fetchDashboardInit = async () => {
    try {
      const res = await adminAPI.getDashboardInit();
      if (res.success) {
        setStats(res.stats);
        setMembers(res.members);
        setAttendances(res.attendances || []);
        if (res.gym) setGymData(res.gym);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard init data:', error);
    }
  };

  const fetchAttendances = async () => {
    try {
      const data = await attendanceAPI.getAll();
      if (data && data.success) {
         setAttendances(data.data);
      } else {
         setAttendances(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await membersAPI.getAll({ name: memberSearch });
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const dData = generateDashboardData(members);
  
  const components = { OverviewSection, MembersSection, PaymentsSection, ReportsSection, AttendanceSection, SettingsSection };
  for (let key in components) {
    if (!components[key]) console.error(`${key} is undefined!`);
  }
  const icons = { FiUsers, FiCalendar, FiCreditCard, FiPieChart, FiSettings, FiCheckSquare, FiHome, FiLogOut, FiBell, FiChevronDown, FiBriefcase };
  for (let key in icons) {
    if (!icons[key]) console.error(`${key} is undefined!`);
  }

  return (
    <div className={`admin-layout ${theme}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand-new">
          <div className="brand-logo-new" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {gymData && gymData.logo_path ? (
              <img src={gymData.logo_path} alt="Gym Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff5533" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M4 8h2.5"/><path d="M4 16h2.5"/><path d="M17.5 8H20"/><path d="M17.5 16H20"/><path d="M6.5 12h11"/></svg>
            )}
          </div>
          <div className="brand-text-new">
            <h2 style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(() => {
                if (gymData && gymData.name) {
                  const name = gymData.name.trim();
                  const spaceIdx = name.indexOf(' ');
                  if (spaceIdx === -1) {
                    return <span className="highlight">{name}</span>;
                  }
                  return (
                    <>
                      {name.substring(0, spaceIdx)} <span className="highlight">{name.substring(spaceIdx + 1)}</span>
                    </>
                  );
                }
                return <>POWER <span className="highlight">GYM</span></>;
              })()}
            </h2>
            <span className="subtitle">MANAGEMENT SYSTEM</span>
          </div>
        </div>
        
        <nav className="sidebar-nav-new">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <FiHome /> <span>Overview</span>
            </li>
            <li className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>
              <FiUsers /> <span>Members</span>
            </li>
            <li className={activeTab === 'trainers' ? 'active' : ''} onClick={() => setActiveTab('trainers')}>
              <FiBriefcase /> <span>Trainers</span>
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => { setActiveTab('attendance'); setIsAttendanceExpanded(!isAttendanceExpanded); }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}><FiCheckSquare /> <span>Attendance</span></div>
                <FiChevronDown style={{ transform: isAttendanceExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </div>
            </li>
            {isAttendanceExpanded && (
              <div className="sidebar-dropdown">
                <div className={`sidebar-dropdown-item ${activeTab === 'attendance' && activeAttendanceTab === 'overview' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('attendance'); setActiveAttendanceTab('overview'); }}>
                  Overview
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'attendance' && activeAttendanceTab === 'members' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('attendance'); setActiveAttendanceTab('members'); }}>
                  Member Check-ins
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'attendance' && activeAttendanceTab === 'trainers' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('attendance'); setActiveAttendanceTab('trainers'); }}>
                  Trainer Check-ins
                </div>
              </div>
            )}
            <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => { setActiveTab('payments'); setIsPaymentsExpanded(!isPaymentsExpanded); }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}><FiCreditCard /> <span>Payments</span></div>
                <FiChevronDown style={{ transform: isPaymentsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </div>
            </li>
            {isPaymentsExpanded && (
              <div className="sidebar-dropdown">
                <div className={`sidebar-dropdown-item ${activeTab === 'payments' && activePaymentsTab === 'overview' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('payments'); setActivePaymentsTab('overview'); }}>
                  Overview
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'payments' && activePaymentsTab === 'endingToday' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('payments'); setActivePaymentsTab('endingToday'); }}>
                  Expiring Today
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'payments' && activePaymentsTab === 'endingWeek' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('payments'); setActivePaymentsTab('endingWeek'); }}>
                  Expiring This Week
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'payments' && activePaymentsTab === 'endingMonth' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('payments'); setActivePaymentsTab('endingMonth'); }}>
                  Expiring This Month
                </div>
              </div>
            )}
            <li className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}>
              <FiTrendingUp /> <span>Expenses</span>
            </li>
            <li className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
              <FiBox /> <span>Inventory</span>
            </li>
            <li className={activeTab === 'equipment' ? 'active' : ''} onClick={() => setActiveTab('equipment')}>
              <FiTool /> <span>Equipment</span>
            </li>
            <li className={activeTab === 'reports' ? 'active' : ''} onClick={() => { setActiveTab('reports'); setIsReportsExpanded(!isReportsExpanded); }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}><FiPieChart /> <span>Reports</span></div>
                <FiChevronDown style={{ transform: isReportsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </div>
            </li>
            {isReportsExpanded && (
              <div className="sidebar-dropdown">
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'overview' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('overview'); }}>
                  <FiPieChart style={{ marginRight: '8px' }} /> Overview
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'revenue' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('revenue'); }}>
                  <span style={{ marginRight: '8px', fontWeight: 'bold' }}>₹</span> Revenue Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'membership' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('membership'); }}>
                  <FiUsers style={{ marginRight: '8px' }} /> Membership Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'attendance' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('attendance'); }}>
                  <FiCheckSquare style={{ marginRight: '8px' }} /> Attendance Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'trainer' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('trainer'); }}>
                  <FiUserPlus style={{ marginRight: '8px' }} /> Trainer Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'workout' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('workout'); }}>
                  <FiActivity style={{ marginRight: '8px' }} /> Workout Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'payment' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('payment'); }}>
                  <FiCreditCard style={{ marginRight: '8px' }} /> Payment Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'expense' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('expense'); }}>
                  <FiTrendingUp style={{ marginRight: '8px' }} /> Expense Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'inventory' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('inventory'); }}>
                  <FiBox style={{ marginRight: '8px' }} /> Inventory Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'sales' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('sales'); }}>
                  <FiShoppingCart style={{ marginRight: '8px' }} /> Sales Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'tax' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('tax'); }}>
                  <FiFileText style={{ marginRight: '8px' }} /> Tax & GST Report
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'reports' && activeReportsTab === 'custom' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('reports'); setActiveReportsTab('custom'); }}>
                  <FiFileText style={{ marginRight: '8px' }} /> Custom Report
                </div>
              </div>
            )}
            <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => { setActiveTab('settings'); setIsSettingsExpanded(!isSettingsExpanded); }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}><FiSettings /> <span>Settings</span></div>
                <FiChevronDown style={{ transform: isSettingsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </div>
            </li>
            {isSettingsExpanded && (
              <div className="sidebar-dropdown">
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'general' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('general'); }}>
                  General Settings
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'branches' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('branches'); }}>
                  Branches
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'plans' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('plans'); }}>
                  Plans & Pricing
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'notifications' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('notifications'); }}>
                  Notifications
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'payments' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('payments'); }}>
                  Payment Methods
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'tax' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('tax'); }}>
                  Tax Settings
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'attendance' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('attendance'); }}>
                  Attendance Settings
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'backup' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('backup'); }}>
                  Backup & Restore
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'security' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('security'); }}>
                  Security
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'email' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('email'); }}>
                  Email Templates
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'integrations' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('integrations'); }}>
                  Integrations
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'wallet' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('wallet'); }}>
                  Wallet
                </div>
                <div className={`sidebar-dropdown-item ${activeTab === 'settings' && activeSettingsTab === 'logs' ? 'active-sub' : ''}`} onClick={() => { setActiveTab('settings'); setActiveSettingsTab('logs'); }}>
                  System Logs
                </div>
              </div>
            )}
          </ul>
        </nav>

        <div className="sidebar-bottom">

          <div className="logout-btn" onClick={() => { localStorage.removeItem('adminToken'); window.location.href='/'; }}>
            <FiLogOut /> <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <h2 className="page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          </div>
          
          <div className="topbar-actions">
            
            <div className="notification-bell">
              <FiBell />
              <span className="badge">3</span>
            </div>

            <div className="user-profile-simple">
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-role">Super Admin</span>
              </div>
              <FiChevronDown className="chevron" />
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && <OverviewSection {...dData} />}
          {activeTab === 'members' && <MembersSection {...dData} processedMembers={members} memberSearch={memberSearch} setMemberSearch={setMemberSearch} fetchMembers={fetchMembers} />}
          {activeTab === 'trainers' && <TrainersSettings />}
          {activeTab === 'payments' && <PaymentsSection 
              {...dData} 
              realPayments={payments}
              fetchPayments={fetchPayments}
              members={members}
              activePaymentsTab={activePaymentsTab}
            />}
          {activeTab === 'reports' && <ReportsSection {...dData} realPayments={payments} revenueReport={revenueReport} membershipReport={membershipReport} attendanceReport={attendanceReport} trainerReport={trainerReport} workoutReport={workoutReport} activeReportsTab={activeReportsTab} />}
          {activeTab === 'attendance' && <AttendanceSection {...dData} attendances={attendances} fetchAttendances={fetchAttendances} activeAttendanceTab={activeAttendanceTab} />}
          {activeTab === 'expenses' && <ExpensesSection />}
          {activeTab === 'inventory' && <InventorySection />}
          {activeTab === 'equipment' && <EquipmentSection />}
          {activeTab === 'settings' && <SettingsSection activeSettingsTab={activeSettingsTab} />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
