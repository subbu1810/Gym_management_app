import React, { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiSmartphone, FiMonitor, FiDownload, FiPlus, FiBarChart2, FiUserX, FiFilter, FiChevronDown, FiCamera, FiUserCheck, FiEye, FiMoreVertical, FiSearch, FiLogOut, FiPieChart, FiTrendingUp, FiPauseCircle, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { membersAPI, plansAPI, trainersAPI } from '../../services/api';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, CartesianGrid, XAxis, YAxis, Area, BarChart, Bar } from 'recharts';
import '../../styles/dashboard/MembersSection.css';

const MembersSection = ({ 
  processedMembers,
  m_total,
  m_active,
  m_expired,
  m_trial,
  m_paused,
  m_statusPie,
  m_genderPie,
  m_planBarData,
  memberSearch,
  setMemberSearch,
  fetchMembers
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', address: '', whatsappNumber: '',
    profilePhoto: '', plan_type: '', amount: '', join_date: '', trainer_id: '',
    gym_slot: 'Morning', status: 'Active', payment_status: 'Paid', terms_accepted: false
  });

  useEffect(() => {
    const fetchPlansAndTrainers = async () => {
      try {
        const [plansData, trainersData] = await Promise.all([
          plansAPI.getAll(),
          trainersAPI.getAll()
        ]);
        setPlans(plansData);
        setTrainers(trainersData);
        if (plansData && plansData.length > 0 && !formData.plan_type) {
          setFormData(prev => ({ ...prev, plan_type: plansData[0].name, amount: plansData[0].price }));
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchPlansAndTrainers();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.name === 'plan_type') {
      const selectedPlan = plans.find(p => p.name === value);
      setFormData({ 
        ...formData, 
        plan_type: value,
        amount: selectedPlan ? selectedPlan.price : formData.amount 
      });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 200 * 1024) {
        toast.error("Image size must be less than 200 KB");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await membersAPI.update(editingId, formData);
        toast.success('Member updated successfully!');
      } else {
        await membersAPI.create(formData);
        toast.success('Member created successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        full_name: '', email: '', phone: '', address: '', whatsappNumber: '',
        profilePhoto: '', plan_type: plans.length > 0 ? plans[0].name : '', amount: plans.length > 0 ? plans[0].price : '', join_date: '', trainer_id: '',
        gym_slot: 'Morning', status: 'Active', payment_status: 'Paid', terms_accepted: false
      });
      if (fetchMembers) fetchMembers();
    } catch (err) {
      toast.error(editingId ? 'Failed to update member' : 'Failed to create member');
      console.error(err);
    }
  };

  const openEditModal = (m) => {
    setEditingId(m.id);
    setFormData({
      full_name: m.full_name || m.username || '',
      email: m.email || '',
      phone: m.phone || '',
      address: m.address || '',
      whatsappNumber: m.whatsappNumber || '',
      profilePhoto: m.profilePhoto || '',
      plan_type: m.bookings?.[0]?.plan_type || m.derivedPlan || (plans.length > 0 ? plans[0].name : ''),
      amount: m.bookings?.[0]?.amount || m.amount || (plans.length > 0 ? plans[0].price : ''),
      join_date: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : (m.joinDate || ''),
      trainer_id: m.trainer_id || '',
      gym_slot: m.gym_slot || 'Morning',
      status: m.bookings?.[0]?.status || m.derivedStatus || 'Active',
      payment_status: m.payment_status || 'Paid',
      terms_accepted: true
    });
    setShowModal(true);
  };

  const confirmDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await membersAPI.delete(id);
        toast.success('Member deleted successfully!');
        if (fetchMembers) fetchMembers();
      } catch (err) {
        toast.error('Failed to delete member');
        console.error(err);
      }
    }
  };

  const filteredMembers = processedMembers.filter((m) => {
    const status = m.bookings?.[0]?.status || m.derivedStatus || 'Active';
    const plan = m.bookings?.[0]?.plan_type || m.derivedPlan || 'Monthly Plan';
    
    let match = true;
    if (statusFilter && status !== statusFilter) match = false;
    if (planFilter && plan !== planFilter) match = false;
    if (trainerFilter && String(m.trainer_id) !== String(trainerFilter)) match = false;
    
    return match;
  });

  return (
    <div>
                {/* TOP STATS FOR MEMBERS */}
                <div className="stats-container col-5">
                  <div className="stat-card" style={{ padding: '16px 20px' }}>
                    <div className="stat-header">
                      <h3 className="stat-title">TOTAL MEMBERS</h3>
                      <div className="stat-icon" style={{width:36, height:36, fontSize:'1.2rem', background: '#eff6ff', color: '#3b82f6'}}><FiUsers /></div>
                    </div>
                    <p className="stat-value" style={{fontSize: '1.5rem'}}>{m_total}</p>
                    <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 12.5% <span>vs last month</span></div>
                  </div>
                  <div className="stat-card" style={{ padding: '16px 20px' }}>
                    <div className="stat-header">
                      <h3 className="stat-title">ACTIVE MEMBERS</h3>
                      <div className="stat-icon" style={{width:36, height:36, fontSize:'1.2rem', background: '#f0fdf4', color: '#22c55e'}}><FiCheckCircle /></div>
                    </div>
                    <p className="stat-value" style={{fontSize: '1.5rem'}}>{m_active}</p>
                    <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 10.3% <span>vs last month</span></div>
                  </div>
                  <div className="stat-card" style={{ padding: '16px 20px' }}>
                    <div className="stat-header">
                      <h3 className="stat-title">EXPIRED MEMBERS</h3>
                      <div className="stat-icon" style={{width:36, height:36, fontSize:'1.2rem', background: '#fef2f2', color: '#ef4444'}}><FiUserX /></div>
                    </div>
                    <p className="stat-value" style={{fontSize: '1.5rem'}}>{m_expired}</p>
                    <div className="stat-trend negative" style={{fontSize: '0.7rem'}}>↓ 8.2% <span>vs last month</span></div>
                  </div>
                  <div className="stat-card" style={{ padding: '16px 20px' }}>
                    <div className="stat-header">
                      <h3 className="stat-title">TRIAL MEMBERS</h3>
                      <div className="stat-icon" style={{width:36, height:36, fontSize:'1.2rem', background: '#fdf4ff', color: '#a855f7'}}><FiClock /></div>
                    </div>
                    <p className="stat-value" style={{fontSize: '1.5rem'}}>{m_trial}</p>
                    <div className="stat-trend positive" style={{fontSize: '0.7rem'}}>↑ 4.6% <span>vs last month</span></div>
                  </div>
                  <div className="stat-card" style={{ padding: '16px 20px' }}>
                    <div className="stat-header">
                      <h3 className="stat-title">PAUSED MEMBERS</h3>
                      <div className="stat-icon" style={{width:36, height:36, fontSize:'1.2rem', background: '#fffbeb', color: '#f59e0b'}}><FiPauseCircle /></div>
                    </div>
                    <p className="stat-value" style={{fontSize: '1.5rem'}}>{m_paused}</p>
                    <div className="stat-trend negative" style={{fontSize: '0.7rem'}}>↓ 3.1% <span>vs last month</span></div>
                  </div>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="filter-toolbar">
                  <div className="filter-group">
                    <div className="filter-search">
                      <FiSearch />
                      <input type="text" placeholder="Search by name, phone or member ID..." value={memberSearch} onChange={(e) => { setMemberSearch(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="">Membership Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Expired">Expired</option>
                      <option value="Trial">Trial</option>
                      <option value="Paused">Paused</option>
                    </select>
                    <select className="filter-select" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="">Plan Type</option>
                      {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <select className="filter-select" value={trainerFilter} onChange={(e) => { setTrainerFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="">Trainer</option>
                      {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.name || `Trainer #${t.id}`}</option>)}
                    </select>
                    <button className="btn-export" style={{ color: '#64748b' }}>More Filters <FiFilter /></button>
                    <button className="btn-export" style={{ color: '#64748b', border: 'none' }} onClick={() => { setStatusFilter(''); setPlanFilter(''); setTrainerFilter(''); setMemberSearch(''); setCurrentPage(1); }}>Reset</button>
                  </div>
                  <div className="filter-group">
                    <button className="btn-export"><FiDownload /> Export</button>
                    <button className="btn-primary" onClick={() => { setEditingId(null); setShowModal(true); }} style={{ background: '#f97316', border: 'none' }}><FiPlus /> Add Member</button>
                  </div>
                </div>

                {/* TABLE */}
                <div className="list-card" style={{ padding: '0', overflowX: 'auto', marginBottom: '24px' }}>
                  <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
                  <table className="attendance-table" style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '10px 16px', width: '40px' }}><input type="checkbox" /></th>
                        <th style={{ padding: '10px 16px' }}>MEMBER ID</th>
                        <th style={{ padding: '10px 16px' }}>MEMBER</th>
                        <th style={{ padding: '10px 16px' }}>PHONE</th>
                        <th style={{ padding: '10px 16px' }}>PLAN</th>
                        <th style={{ padding: '10px 16px' }}>TRAINER</th>
                        <th style={{ padding: '10px 16px' }}>STATUS</th>
                        <th style={{ padding: '10px 16px' }}>JOIN DATE</th>
                        <th style={{ padding: '10px 16px' }}>EXPIRY DATE</th>
                        <th style={{ padding: '10px 16px' }}>DAYS LEFT</th>
                        <th style={{ padding: '10px 16px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((m, i) => {
                        const status = m.bookings?.[0]?.status || m.derivedStatus || 'Active';
                        const plan = m.bookings?.[0]?.plan_type || m.derivedPlan || 'Monthly Plan';
                        const age = m.age || m.derivedAge || 25;
                        const gender = m.gender || m.derivedGender || 'Male';
                        const joinDate = m.created_at || m.joinDate;
                        const daysLeft = m.daysLeft || 20;

                        let statusClass = 'text-green';
                        if (status === 'Paused') statusClass = 'text-orange';
                        if (status === 'Expired' || status === 'Cancelled') statusClass = 'text-red';
                        if (status === 'Trial') statusClass = 'text-purple';
                        if (status === 'Pending') statusClass = 'text-orange';
                        
                        let planClass = 'badge-soft orange';
                        if (plan.includes('Quarter') || plan.includes('3 Month')) planClass = 'badge-soft blue';
                        if (plan.includes('Year')) planClass = 'badge-soft green';
                        if (plan.includes('Custom')) planClass = 'badge-soft purple';

                        let daysClass = 'badge-soft green';
                        if (daysLeft !== null && daysLeft < 30) daysClass = 'badge-soft orange';
                        if (daysLeft !== null && daysLeft < 10) daysClass = 'badge-soft red';

                        return (
                        <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 16px' }}><input type="checkbox" /></td>
                          <td style={{ padding: '10px 16px', fontWeight: '600', color: '#0f172a' }}>M-{1000 + (m.id || i)}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <div className="user-info-wrapper" style={{ gap: '8px' }}>
                              <img src={m.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || m.username || 'Member')}&background=random`} alt="user" className="user-avatar" style={{width: 28, height: 28, objectFit: 'cover'}}/>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h4 style={{fontSize: '0.8rem', margin: 0, fontWeight: '600', color: '#0f172a'}}>{m.full_name || m.username || 'Member'}</h4>
                                <span style={{fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>{age} Yrs, {gender}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#0f172a' }}>{m.phone || '9876543210'}</td>
                          <td style={{ padding: '10px 16px' }}><span className={planClass}>{plan}</span></td>
                          <td style={{ padding: '10px 16px' }}>
                            <div className="user-info-wrapper" style={{ gap: '8px' }}>
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.trainer_name || 'Unassigned')}&background=random`} alt="trainer" className="user-avatar" style={{width: 24, height: 24}}/>
                              <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>{m.trainer_name ? m.trainer_name : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Unassigned</span>}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px' }}><span className={statusClass}>{status}</span></td>
                          <td style={{ padding: '10px 16px', color: '#64748b' }}>{joinDate ? new Date(joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                          <td style={{ padding: '10px 16px', color: '#64748b' }}>{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                          <td style={{ padding: '10px 16px' }}>
                            {m.daysLeft !== null ? <span className={daysClass}>{m.daysLeft} Days</span> : '-'}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <div className="action-icons" style={{ display: 'flex', gap: '10px' }}>
                              <FiEye onClick={() => toast('View member details coming soon!')} style={{ cursor: 'pointer', color: '#64748b' }} />
                              <FiEdit2 onClick={() => openEditModal(m)} style={{ cursor: 'pointer', color: '#3b82f6' }} />
                              <FiMoreVertical onClick={() => confirmDelete(m.id)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
                    <div>Showing {filteredMembers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <select 
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                      <div className="page-controls">
                        <button className="page-btn" disabled={currentPage === 1 || filteredMembers.length === 0} onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
                        {Array.from({ length: Math.ceil(filteredMembers.length / itemsPerPage) }, (_, i) => {
                          const page = i + 1;
                          const total = Math.ceil(filteredMembers.length / itemsPerPage);
                          if (page === 1 || page === total || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                              <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={`ellipsis-${page}`} style={{ padding: '4px' }}>...</span>;
                          }
                          return null;
                        })}
                        <button className="page-btn" disabled={currentPage === Math.ceil(filteredMembers.length / itemsPerPage) || filteredMembers.length === 0} onClick={() => setCurrentPage(currentPage + 1)}>›</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM CHARTS (MEMBERS) */}
                <div className="charts-container" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <div className="chart-card" style={{ padding: '24px 20px' }}>
                    <div className="chart-card-header"><h3>Members by Status</h3></div>
                    <div style={{ width: '100%', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={m_statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                            {m_statusPie.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                         <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>{m_total}</div>
                         <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {m_statusPie.map(item => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div> <span style={{ color: '#64748b', fontWeight: '500' }}>{item.name}</span></div>
                          <div style={{fontWeight: '700', color: '#0f172a'}}>{item.value} <span style={{color:'#94a3b8'}}>({m_total ? Math.round((item.value/m_total)*100) : 0}%)</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-card" style={{ padding: '24px 20px' }}>
                    <div className="chart-card-header"><h3>Members by Gender</h3></div>
                    <div style={{ width: '100%', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={m_genderPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                            {m_genderPie.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                         <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>{m_total}</div>
                         <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {m_genderPie.map(item => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div> <span style={{ color: '#64748b', fontWeight: '500' }}>{item.name}</span></div>
                          <div style={{fontWeight: '700', color: '#0f172a'}}>{item.value} <span style={{color:'#94a3b8'}}>({m_total ? Math.round((item.value/m_total)*100) : 0}%)</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-card" style={{ padding: '24px 20px' }}>
                    <div className="chart-card-header"><h3>Members by Plan</h3></div>
                    <div style={{ width: '100%', marginTop: '20px' }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={m_planBarData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={85} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                            {m_planBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="list-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
                    <div className="list-header" style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1rem' }}>Recent Members</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                       {processedMembers.slice(0, 4).map((m, i) => (
                         <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                           <div className="user-info-wrapper" style={{ flex: 1.5 }}>
                              <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt="user" className="user-avatar" style={{width: 28, height: 28}}/>
                              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.75rem' }}>{m.full_name || m.username || 'Member'}</div>
                           </div>
                           <div style={{ flex: 1, fontSize: '0.75rem', color: '#64748b' }}>M-{1000 + m.id}</div>
                           <div style={{ flex: 1, fontSize: '0.75rem' }}>
                             <span className={m.derivedStatus === 'Active' ? 'text-green' : (m.derivedStatus === 'Trial' ? 'text-purple' : 'text-gray')}>{m.derivedStatus}</span>
                           </div>
                         </div>
                       ))}
                    </div>
                    <button style={{ width: '100%', padding: '10px', marginTop: '16px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      View All →
                    </button>
                  </div>
                </div>

                 
      {showModal && (
        <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',justifyContent:'center',alignItems:'center'}}>
          <div className="modal-content" style={{background:'#fff',padding:'30px',borderRadius:'12px',width:'650px',maxWidth:'90%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',borderBottom:'1px solid #e2e8f0',paddingBottom:'10px'}}>
              <h2 style={{margin:0,fontSize:'1.2rem',color:'#0f172a'}}>{editingId ? 'Edit Member' : 'Add New Member'}</h2>
              <button onClick={() => setShowModal(false)} style={{background:'none',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'#64748b'}}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveMember}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px',marginBottom:'20px'}}>
                <div style={{gridColumn:'1 / -1'}}>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Full Name *</label>
                  <input type="text" name="full_name" required value={formData.full_name} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Email Address *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Phone Number *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>WhatsApp Number *</label>
                  <input type="tel" name="whatsappNumber" required value={formData.whatsappNumber} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Address *</label>
                  <input type="text" name="address" required value={formData.address} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Profile Photo (Max 200KB) *</label>
                  <input type="file" accept="image/*" name="profilePhoto" required={!editingId} onChange={handlePhotoChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1',background:'#f8fafc'}}/>
                </div>

                <div style={{gridColumn:'1 / -1', borderTop:'1px solid #e2e8f0', marginTop:'10px', paddingTop:'15px'}}>
                  <h3 style={{fontSize:'1rem', marginBottom:'10px'}}>Subscription Details</h3>
                </div>
                
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Plan Type *</label>
                  <select name="plan_type" required value={formData.plan_type} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1',background:'#fff'}}>
                    {plans.length > 0 ? (
                      plans.map(plan => (
                        <option key={plan.id} value={plan.name}>{plan.name} - ₹{plan.price}</option>
                      ))
                    ) : (
                      <option value="">No plans available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Join Date *</label>
                  <input type="date" name="join_date" required value={formData.join_date} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Gym Slot *</label>
                  <select name="gym_slot" required value={formData.gym_slot} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1',background:'#fff'}}>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Payment Amount *</label>
                  <input type="number" name="amount" required value={formData.amount} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1'}}/>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'5px',fontSize:'0.85rem',fontWeight:'500'}}>Assign Trainer (Optional)</label>
                  <select name="trainer_id" value={formData.trainer_id} onChange={handleInputChange} style={{width:'100%',padding:'10px',borderRadius:'6px',border:'1px solid #cbd5e1',background:'#fff'}}>
                    <option value="">-- No Trainer Assigned --</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>{trainer.full_name || trainer.name || `Trainer #${trainer.id}`}</option>
                    ))}
                  </select>
                </div>
                
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}>
                <button type="button" onClick={() => setShowModal(false)} style={{padding:'10px 20px',borderRadius:'6px',border:'1px solid #cbd5e1',background:'#fff',cursor:'pointer'}}>Cancel</button>
                <button type="submit" style={{padding:'10px 20px',borderRadius:'6px',border:'none',background:'#f97316',color:'#fff',cursor:'pointer',fontWeight:'500'}}>Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MembersSection;
