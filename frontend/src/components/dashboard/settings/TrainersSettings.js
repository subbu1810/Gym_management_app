import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiUser, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { trainersAPI } from '../../../services/api';

const TrainersSettings = () => {
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Tabs for the huge form
  const [activeTab, setActiveTab] = useState('personal');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const initialFormState = {
    gym_id: localStorage.getItem('gymId') || 1,
    first_name: '', last_name: '', profile_photo: '', gender: '', dob: '', 
    phone: '', alternate_phone: '', email: '', address: '', city: '', state: '', country: '', pincode: '',
    specializations: [], experience_years: '', qualification: '', certifications: [], languages_known: [], bio: '',
    working_days: [], shift: '', start_time: '', end_time: '', weekly_off: '', break_time: '',
    available_for_pt: false, max_members_per_day: '', max_sessions_per_day: '', online_training_available: false, home_visit_available: false,
    skills: [], username: '', status: 'active'
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setIsLoading(true);
    try {
      const data = await trainersAPI.getAll();
      setTrainers(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch trainers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(t => {
    if (statusFilter !== 'All') {
      if (t.status !== statusFilter.toLowerCase()) return false;
    }
    if (searchTerm) {
      return (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
             (t.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrainers = filteredTrainers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredTrainers.length / itemsPerPage));

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setActiveTab('personal');
    setShowModal(true);
  };

  const openEditModal = (trainer) => {
    setEditingId(trainer.id);
    setFormData({
      ...initialFormState,
      ...trainer,
      specializations: Array.isArray(trainer.specializations) ? trainer.specializations : (trainer.specializations ? JSON.parse(trainer.specializations) : []),
      certifications: Array.isArray(trainer.certifications) ? trainer.certifications : (trainer.certifications ? JSON.parse(trainer.certifications) : []),
      languages_known: Array.isArray(trainer.languages_known) ? trainer.languages_known : (trainer.languages_known ? JSON.parse(trainer.languages_known) : []),
      working_days: Array.isArray(trainer.working_days) ? trainer.working_days : (trainer.working_days ? JSON.parse(trainer.working_days) : []),
      skills: Array.isArray(trainer.skills) ? trainer.skills : (trainer.skills ? JSON.parse(trainer.skills) : [])
    });
    setActiveTab('personal');
    setShowModal(true);
  };

  const handleDeleteTrainer = (id) => {
    setTrainerToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!trainerToDelete) return;
    try {
      await trainersAPI.delete(trainerToDelete);
      toast.success("Trainer deleted successfully!");
      setShowDeleteModal(false);
      setTrainerToDelete(null);
      fetchTrainers();
    } catch (error) {
      toast.error("Failed to delete trainer");
    }
  };

  const handleSubmitTrainer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await trainersAPI.update(editingId, formData);
        toast.success("Trainer updated successfully!");
      } else {
        await trainersAPI.create(formData);
        toast.success("Trainer created successfully!");
      }
      setShowModal(false);
      setFormData(initialFormState);
      fetchTrainers();
    } catch (error) {
      toast.error(`Failed to ${editingId ? 'update' : 'create'} trainer`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await trainersAPI.update(id, { status: newStatus });
      toast.success(`Trainer marked as ${newStatus === 'active' ? 'Active' : 'Inactive'}`);
      fetchTrainers();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  // Predefined lists
  const specializationsList = ['Weight Training', 'Cardio', 'CrossFit', 'Yoga', 'Zumba', 'Pilates', 'Functional Training', 'Personal Training', 'Strength Training', 'HIIT', 'Nutrition Coaching'];
  const skillsList = ['Weight Loss', 'Muscle Gain', 'Bodybuilding', 'Powerlifting', 'Fat Loss', 'Rehabilitation', 'Yoga', 'Cardio', 'Functional Fitness', 'Nutrition Planning'];
  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Trainers Management</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Manage your gym's trainers, their specialties and contact info.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', outline: 'none' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search trainers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '200px' }}
            />
          </div>
          <button 
            onClick={openCreateModal}
            style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <FiPlus /> Add Trainer
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <style>{`
          .trainers-table th, .trainers-table td {
            border: 1px solid #e2e8f0;
          }
        `}</style>
        <table className="trainers-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
              <th style={{ padding: '12px 16px', width: '40px' }}><input type="checkbox" /></th>
              <th style={{ padding: '12px 16px' }}>ID</th>
              <th style={{ padding: '12px 16px' }}>NAME</th>
              <th style={{ padding: '12px 16px' }}>GENDER</th>
              <th style={{ padding: '12px 16px' }}>AGE</th>
              <th style={{ padding: '12px 16px' }}>SPECIALTIES</th>
              <th style={{ padding: '12px 16px' }}>PHONE</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '20px', height: '20px', border: '3px solid #f3f3f3', 
                      borderTop: '3px solid #3b82f6', borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }}></div>
                    <span>Loading trainers...</span>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  </div>
                </td>
              </tr>
            ) : currentTrainers.length > 0 ? currentTrainers.map(trainer => (
              <tr key={trainer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px' }}><input type="checkbox" /></td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>TR{String(trainer.id).padStart(3, '0')}</td>
                <td style={{ padding: '12px 16px', color: '#0f172a', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {trainer.name}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.85rem' }}>
                  {trainer.gender || '-'}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.85rem' }}>
                  {trainer.dob ? calculateAge(trainer.dob) : '-'}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {trainer.specializations && trainer.specializations.length > 0 
                    ? (typeof trainer.specializations === 'string' ? JSON.parse(trainer.specializations) : trainer.specializations).slice(0, 2).join(', ') + (trainer.specializations.length > 2 ? '...' : '') 
                    : (trainer.specialty || '-')}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {trainer.phone || '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {trainer.status === 'active' ? (
                    <span onClick={() => toggleStatus(trainer.id, trainer.status)} style={{ padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}>Active</span>
                  ) : (
                    <span onClick={() => toggleStatus(trainer.id, trainer.status)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}>Inactive</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', color: '#64748b', fontSize: '1rem' }}>
                    <FiEdit2 onClick={() => openEditModal(trainer)} style={{ cursor: 'pointer', color: '#3b82f6' }} title="Edit Trainer" />
                    <FiTrash2 onClick={() => handleDeleteTrainer(trainer.id)} style={{ cursor: 'pointer', color: '#ef4444' }} title="Delete Trainer" />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No trainers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Showing {filteredTrainers.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTrainers.length)} of {filteredTrainers.length} trainers
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            value={itemsPerPage} 
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => handlePageChange(page)} style={{ padding: '6px 12px', border: currentPage === page ? 'none' : '1px solid #e2e8f0', background: currentPage === page ? '#f97316' : '#fff', color: currentPage === page ? '#fff' : '#0f172a', borderRadius: '6px', cursor: 'pointer' }}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>›</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '40px 20px' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '900px', maxWidth: '100%', background: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column', minHeight: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.5rem' }}>{editingId ? 'Edit Trainer Profile' : 'Add New Trainer'}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Fill in the complete details for the trainer.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}><FiX /></button>
            </div>

            <form onSubmit={handleSubmitTrainer} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Modal Body with Sidebar Tabs */}
              <div style={{ display: 'flex', flex: 1 }}>
                
                {/* Tabs Sidebar */}
                <div style={{ width: '220px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '24px 0' }}>
                  {['personal', 'professional', 'schedule', 'availability'].map(tab => (
                    <div 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '12px 24px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        color: activeTab === tab ? '#f97316' : '#475569',
                        background: activeTab === tab ? '#fff' : 'transparent',
                        borderLeft: activeTab === tab ? '3px solid #f97316' : '3px solid transparent',
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab === 'availability' ? 'Skills & Availability' : tab}
                    </div>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, padding: '32px', overflowY: 'auto', maxHeight: '600px' }}>
                  
                  {activeTab === 'personal' && (
                    <div className="tab-pane">
                      <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.1rem' }}>Personal Information</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>First Name</label>
                          <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Last Name</label>
                          <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Gender</label>
                          <select name="gender" value={formData.gender} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Date of Birth</label>
                          <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                          {formData.dob && <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Age: {calculateAge(formData.dob)} years</span>}
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Mobile Number *</label>
                          <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Alternate Mobile</label>
                          <input type="text" name="alternate_phone" value={formData.alternate_phone} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Email Address *</label>
                          <input required type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Address</label>
                          <input type="text" name="address" value={formData.address} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>City</label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>State</label>
                          <input type="text" name="state" value={formData.state} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Country</label>
                          <input type="text" name="country" value={formData.country} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Pincode</label>
                          <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Username (For Login)</label>
                          <input type="text" name="username" value={formData.username} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Status</label>
                          <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'professional' && (
                    <div className="tab-pane">
                      <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.1rem' }}>Professional Information</h4>
                      
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Specialization (Multiple Selection)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                          {specializationsList.map(spec => (
                            <label key={spec} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                              <input type="checkbox" checked={formData.specializations?.includes(spec) || false} onChange={() => handleArrayToggle('specializations', spec)} />
                              {spec}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Experience (Years)</label>
                          <input type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Qualification</label>
                          <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Bio / About Trainer</label>
                          <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'schedule' && (
                    <div className="tab-pane">
                      <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.1rem' }}>Working Schedule</h4>
                      
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Working Days</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {daysList.map(day => (
                            <label key={day} style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                padding: '8px 16px', 
                                borderRadius: '20px', 
                                border: formData.working_days?.includes(day) ? '1px solid #f97316' : '1px solid #cbd5e1',
                                background: formData.working_days?.includes(day) ? '#fff7ed' : '#fff',
                                color: formData.working_days?.includes(day) ? '#ea580c' : '#475569',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}>
                              <input type="checkbox" checked={formData.working_days?.includes(day) || false} onChange={() => handleArrayToggle('working_days', day)} style={{ display: 'none' }} />
                              {day.slice(0, 3)}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Shift</label>
                          <select name="shift" value={formData.shift} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}>
                            <option value="">Select Shift</option>
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Evening">Evening</option>
                            <option value="Full Day">Full Day</option>
                            <option value="Split Shift">Split Shift</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Weekly Off</label>
                          <select name="weekly_off" value={formData.weekly_off} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}>
                            <option value="">Select Day</option>
                            {daysList.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Start Time</label>
                          <input type="time" name="start_time" value={formData.start_time ? formData.start_time.slice(0,5) : ''} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>End Time</label>
                          <input type="time" name="end_time" value={formData.end_time ? formData.end_time.slice(0,5) : ''} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Break Time</label>
                          <input type="text" name="break_time" placeholder="e.g. 1:00 PM - 2:00 PM" value={formData.break_time} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'availability' && (
                    <div className="tab-pane">
                      <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.1rem' }}>Availability & Capabilities</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                          <input type="checkbox" name="available_for_pt" checked={formData.available_for_pt} onChange={handleInputChange} style={{ width: '18px', height: '18px' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>Personal Training</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>Available for 1-on-1 PT sessions</div>
                          </div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                          <input type="checkbox" name="online_training_available" checked={formData.online_training_available} onChange={handleInputChange} style={{ width: '18px', height: '18px' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>Online Training</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>Can conduct virtual sessions</div>
                          </div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                          <input type="checkbox" name="home_visit_available" checked={formData.home_visit_available} onChange={handleInputChange} style={{ width: '18px', height: '18px' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>Home Visits</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>Available for at-home training</div>
                          </div>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Max Members / Day</label>
                            <input type="number" name="max_members_per_day" value={formData.max_members_per_day} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Max Sessions / Day</label>
                            <input type="number" name="max_sessions_per_day" value={formData.max_sessions_per_day} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      </div>

                      <h4 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '1.1rem', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>Trainer Skills</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                        {skillsList.map(skill => (
                          <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input type="checkbox" checked={formData.skills?.includes(skill) || false} onChange={() => handleArrayToggle('skills', skill)} style={{ width: '16px', height: '16px', accentColor: '#f97316' }} />
                            {skill}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Trainer' : 'Create Trainer')} {isSubmitting ? '' : <FiCheck />}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px', background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem' }}>
              <FiTrash2 />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Delete Trainer</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.9rem' }}>Are you sure you want to delete this trainer? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainersSettings;
