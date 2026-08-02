import React from 'react';
import { FiDownload, FiCalendar, FiSettings } from 'react-icons/fi';
import '../../styles/dashboard/ReportsSection.css';

import ReportsOverview from './reports/ReportsOverview';
import RevenueReport from './reports/RevenueReport';
import MembershipReport from './reports/MembershipReport';
import AttendanceReport from './reports/AttendanceReport';
import TrainerReport from './reports/TrainerReport';
import WorkoutReport from './reports/WorkoutReport';
import PaymentReport from './reports/PaymentReport';
import ExpenseReport from './reports/ExpenseReport';
import InventoryReport from './reports/InventoryReport';
import SalesReport from './reports/SalesReport';
import TaxReport from './reports/TaxReport';

const ReportsSection = ({ 
  m_total, 
  m_statusPie, 
  realPayments, 
  revenueReport,
  membershipReport,
  attendanceReport,
  trainerReport,
  workoutReport,
  activeReportsTab 
}) => {
  const displayPayments = realPayments || [];
  
  // Extract real backend report data or fallback to empty arrays
  const r_revenueSparkline = revenueReport?.revenueSparkline || [];
  const r_membersSparkline = revenueReport?.membersSparkline || [];
  const r_newMembersSparkline = revenueReport?.membersSparkline || []; // Using members for now
  const r_revenueSourcePie = revenueReport?.revenueSourcePie || [];
  const r_trainerBar = revenueReport?.trainerBar || [];
  const lineData = revenueReport?.lineData || [];

  // Use backend aggregated totals when available, else calculate from raw payments
  const p_totalCollection = revenueReport?.totalRevenue ||
    displayPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const p_received = revenueReport?.received ||
    displayPayments.filter(p => (p.payment_status || p.p_status) === 'Paid')
      .reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const p_pending = revenueReport?.pending ||
    displayPayments.filter(p => (p.payment_status || p.p_status) === 'Pending')
      .reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const p_refunded = revenueReport?.refunded ||
    displayPayments.filter(p => (p.payment_status || p.p_status) === 'Refunded')
      .reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  
  const p_statusCounts = { Paid: 0, Pending: 0, Refunded: 0 };
  displayPayments.forEach(p => {
    const st = p.payment_status || p.p_status;
    if (p_statusCounts[st] !== undefined) p_statusCounts[st]++;
  });

  const renderContent = () => {
    switch(activeReportsTab) {
      case 'overview':
        return (
          <ReportsOverview 
            r_revenueSparkline={r_revenueSparkline}
            r_membersSparkline={r_membersSparkline}
            r_newMembersSparkline={r_newMembersSparkline}
            p_totalCollection={p_totalCollection}
            m_total={m_total}
            displayPayments={displayPayments}
            p_pending={p_pending}
            p_statusCounts={p_statusCounts}
          />
        );
      case 'revenue':
        return (
          <RevenueReport 
            lineData={lineData}
            r_revenueSourcePie={r_revenueSourcePie}
            p_totalCollection={p_totalCollection}
            p_received={p_received}
            p_pending={p_pending}
            p_refunded={p_refunded}
            recentTransactions={displayPayments.slice(0, 5)}
          />
        );
      case 'membership':
        return <MembershipReport />;
      case 'attendance':
        return <AttendanceReport />;
      case 'trainer':
        return <TrainerReport />;
      case 'workout':
        return <WorkoutReport />;
      case 'payment':
        return <PaymentReport />;
      case 'expense':
        return <ExpenseReport />;
      case 'inventory':
        return <InventoryReport />;
      case 'sales':
        return <SalesReport />;
      case 'tax':
        return <TaxReport displayPayments={displayPayments} />;
      default:
        return <div style={{ padding: '24px', background: '#fff', borderRadius: '12px' }}>This report is under construction.</div>;
    }
  };

  return (
    <div className="reports-dashboard" style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
         {/* REPORTS HEADER */}
         {/* DYNAMIC CONTENT */}
         {renderContent()}
      </div>
    </div>
  );
};

export default ReportsSection;
