export const generateDashboardData = (bookings) => {
  const members = bookings || [];
  
  // Dashboard / Bookings
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'Active' || b.status === 'Completed' || b.status === 'Success').length;
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled' || b.status === 'Expired').length;
  const pendingBookings = bookings.filter(b => b.status === 'Pending').length;

  const planCounts = { 'Monthly Plan': 0, 'Quarterly Plan': 0, 'Yearly Plan': 0, 'Custom Plan': 0 };
  bookings.forEach(b => {
    if (planCounts[b.plan_type] !== undefined) planCounts[b.plan_type]++;
    else planCounts['Custom Plan'] = (planCounts['Custom Plan'] || 0) + 1;
  });
  
  const pieData = [
    { name: 'Monthly Plan', value: planCounts['Monthly Plan'], color: '#f97316' },
    { name: 'Quarterly Plan', value: planCounts['Quarterly Plan'], color: '#3b82f6' },
    { name: 'Yearly Plan', value: planCounts['Yearly Plan'], color: '#22c55e' },
    { name: 'Custom Plan', value: planCounts['Custom Plan'], color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const statusPieData = [
    { name: 'Active', value: completedBookings, color: '#22c55e' },
    { name: 'Pending', value: pendingBookings, color: '#f97316' },
    { name: 'Cancelled', value: cancelledBookings, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const lineData = [
    { name: '1 May', success: 10, pending: 5, failed: 0 },
    { name: '7 May', success: 38, pending: 12, failed: 5 },
    { name: '14 May', success: 60, pending: 32, failed: 12 },
    { name: '21 May', success: 80, pending: 52, failed: 22 },
    { name: '28 May', success: 60, pending: 40, failed: 18 },
    { name: '31 May', success: 75, pending: 48, failed: 26 },
    { name: '4 Jun', success: 90, pending: 60, failed: 25 },
  ];

  // Members Analytics Data
  const m_total = members.length;
  let m_active = 0, m_expired = 0, m_trial = 0, m_paused = 0;
  let m_male = 0, m_female = 0;
  const m_planCounts = { 'Monthly Plan': 0, 'Quarterly Plan': 0, 'Yearly Plan': 0, 'Custom Plan': 0 };

  const processedMembers = members.map(m => {
    let status = m.status === 'Active' ? 'Active' : 'Trial';
    let plan = m.plan_type || 'N/A';
    if (status === 'Active') m_active++;
    else if (status === 'Expired') m_expired++;
    else m_trial++;
    m_male++; // Simplified

    return { ...m, derivedStatus: status, derivedPlan: plan, daysLeft: 20, derivedAge: 25, derivedGender: 'Male' };
  });

  const m_statusPie = [
    { name: 'Active', value: m_active, color: '#22c55e' },
    { name: 'Expired', value: m_expired, color: '#ef4444' },
    { name: 'Trial', value: m_trial, color: '#8b5cf6' },
  ];
  const m_genderPie = [
    { name: 'Male', value: m_male, color: '#3b82f6' },
    { name: 'Female', value: m_female, color: '#ec4899' }
  ];
  const m_planBarData = pieData;



  return {
    totalBookings, completedBookings, cancelledBookings, pendingBookings, pieData, statusPieData, lineData,
    m_total, m_active, m_expired, m_trial, m_paused, m_statusPie, m_genderPie, m_planBarData, processedMembers
  };
};
