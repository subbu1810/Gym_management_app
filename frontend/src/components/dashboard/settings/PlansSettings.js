import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiCopy, FiMoreVertical, FiPlus, FiCheck, FiCalendar, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { plansAPI } from '../../../services/api';

const PlansSettings = () => {
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const initialFormState = {
    name: '',
    duration_months: 1,
    duration_days: 30,
    price: '',
    description: '',
    features: '',
    color_theme: 'green',
    is_active: true,
    gym_id: localStorage.getItem('gymId') || 1
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await plansAPI.getAll();
      setPlans(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch plans');
    }
  };

  const filteredPlans = plans.filter(p => {
    if (statusFilter !== 'All') {
      const wantActive = statusFilter === 'Active';
      if (p.is_active !== wantActive) return false;
    }
    if (searchTerm) {
      return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Reset to first page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan.id);
    setFormData({
      ...plan,
      features: plan.features ? plan.features.join(', ') : ''
    });
    setShowModal(true);
  };

  const handleDeletePlan = (id) => {
    setPlanToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      await plansAPI.delete(planToDelete);
      toast.success("Plan deleted successfully!");
      setShowDeleteModal(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const featuresArr = formData.features.split(',').map(f => f.trim()).filter(f => f);
      const dataToSubmit = { ...formData, features: featuresArr };
      
      if (editingId) {
        await plansAPI.update(editingId, dataToSubmit);
        toast.success("Plan updated successfully!");
      } else {
        await plansAPI.create(dataToSubmit);
        toast.success("Plan created successfully!");
      }
      setShowModal(false);
      setFormData(initialFormState);
      fetchPlans();
    } catch (error) {
      toast.error(`Failed to ${editingId ? 'update' : 'create'} plan`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await plansAPI.update(id, { is_active: !currentStatus });
      toast.success(`Plan marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchPlans();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>Membership Plans</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Manage your membership plans, durations and pricing.</p>
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
              placeholder="Search plans..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '200px' }}
            />
          </div>
          <button 
            onClick={openCreateModal}
            style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <FiPlus /> Create New Plan
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <th style={{ padding: '8px 12px', width: '30px', border: '1px solid #e2e8f0' }}><input type="checkbox" /></th>
            <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Code</th>
            <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Plan Name</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Months</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Days</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #e2e8f0' }}>Total Price</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #e2e8f0' }}>Monthly Rate</th>
            <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Description</th>
            <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Features</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Status</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', width: '80px', border: '1px solid #e2e8f0' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPlans.length > 0 ? currentPlans.map(plan => (
            <tr key={plan.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}><input type="checkbox" /></td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#64748b' }}>#PLN-{String(plan.id).padStart(3, '0')}</td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem',
                    background: plan.color_theme === 'green' ? '#dcfce7' : plan.color_theme === 'blue' ? '#eff6ff' : plan.color_theme === 'orange' ? '#ffedd5' : '#f3e8ff',
                    color: plan.color_theme === 'green' ? '#22c55e' : plan.color_theme === 'blue' ? '#3b82f6' : plan.color_theme === 'orange' ? '#f97316' : '#a855f7'
                  }}>
                    <FiCheck size={12} />
                  </div>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{plan.name}</span>
                </div>
              </td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '600' }}>{plan.duration_months} mo</td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>{plan.duration_days} days</td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>₹{Number(plan.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600', color: '#16a34a' }}>
                ₹{plan.duration_months > 0 ? Math.round(plan.price / plan.duration_months).toLocaleString() : Number(plan.price).toLocaleString()}/mo
              </td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                {plan.description?.substring(0, 45)}{plan.description?.length > 45 ? '...' : ''}
              </td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {plan.features?.slice(0, 2).map((f, i) => (
                    <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>{f}</span>
                  ))}
                  {plan.features?.length > 2 && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>+{plan.features.length - 2}</span>}
                </div>
              </td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                {plan.is_active ? (
                  <span onClick={() => toggleStatus(plan.id, plan.is_active)} style={{ padding: '2px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer' }}>Active</span>
                ) : (
                  <span onClick={() => toggleStatus(plan.id, plan.is_active)} style={{ padding: '2px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer' }}>Inactive</span>
                )}
              </td>
              <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <FiEdit2 onClick={() => openEditModal(plan)} style={{ cursor: 'pointer', color: '#3b82f6' }} size={12} title="Edit Plan" />
                  <FiTrash2 onClick={() => handleDeletePlan(plan.id)} style={{ cursor: 'pointer', color: '#ef4444' }} size={12} title="Delete Plan" />
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>No membership plans found.</td>
            </tr>
          )}
        </tbody>
      </table>
      
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Showing {filteredPlans.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPlans.length)} of {filteredPlans.length} plans
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
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
              ‹
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => handlePageChange(page)}
                style={{ 
                  padding: '6px 12px', 
                  border: currentPage === page ? 'none' : '1px solid #e2e8f0', 
                  background: currentPage === page ? '#f97316' : '#fff', 
                  color: currentPage === page ? '#fff' : '#0f172a', 
                  borderRadius: '6px', 
                  cursor: 'pointer' 
                }}>
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
              ›
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>{editingId ? 'Edit Plan' : 'Create New Plan'}</h3>
            <form onSubmit={handleSubmitPlan}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Plan Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Months</label>
                  <input required type="number" name="duration_months" value={formData.duration_months} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Days</label>
                  <input required type="number" name="duration_days" value={formData.duration_days} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Price</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Theme Color</label>
                  <select name="color_theme" value={formData.color_theme} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }}>
                    <option value="green">Green (Basic)</option>
                    <option value="blue">Blue (Standard)</option>
                    <option value="orange">Orange (Premium)</option>
                    <option value="purple">Purple (Elite)</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Features (comma separated)</label>
                  <textarea name="features" rows="3" value={formData.features} onChange={handleInputChange} placeholder="Gym Access, Locker Room, Group Classes" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', border: 'none', background: '#f97316', color: '#fff', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Delete Plan</h3>
            <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: '0.9rem' }}>Are you sure you want to delete this plan? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#64748b' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlansSettings;
