import React, { useState, useEffect } from 'react';
import { FiEdit2, FiSearch, FiDollarSign, FiPlus } from 'react-icons/fi';
import { superAdminAPI, gymsAPI } from '../../services/api';
import '../../styles/AdminDashboard.css';

function SuperAdminGyms() {
  const [gyms, setGyms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    admin_username: '',
    admin_password: ''
  });

  const [formData, setFormData] = useState({
    subscription_status: 'active',
    subscription_plan: '',
    subscription_ends_at: ''
  });

  const [walletForm, setWalletForm] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchGyms();
  }, []);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const data = await superAdminAPI.getGyms();
      setGyms(data);
    } catch (error) {
      console.error("Error fetching gyms:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (gym) => {
    setSelectedGym(gym);
    setFormData({
      subscription_status: gym.subscription_status || 'trial',
      subscription_plan: gym.subscription_plan || '',
      subscription_ends_at: gym.subscription_ends_at ? gym.subscription_ends_at.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const openWalletModal = (gym) => {
    setSelectedGym(gym);
    setWalletForm({
      amount: '',
      description: 'Super Admin Top-up'
    });
    setIsWalletModalOpen(true);
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsWalletModalOpen(false);
    setIsCreateModalOpen(false);
    setSelectedGym(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await gymsAPI.registerGym(createForm);
      await fetchGyms();
      closeModals();
      setCreateForm({ name: '', email: '', phone: '', address: '', admin_username: '', admin_password: '' });
      alert("Gym created successfully!");
    } catch (error) {
      console.error("Error creating gym:", error);
      alert(error.response?.data?.message || "Failed to create gym.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.updateSubscription(selectedGym.id, formData);
      await fetchGyms();
      closeModals();
      alert("Subscription updated successfully!");
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription.");
    }
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.updateWallet(selectedGym.id, walletForm);
      await fetchGyms();
      closeModals();
      alert("Wallet updated successfully!");
    } catch (error) {
      console.error("Error updating wallet:", error);
      alert("Failed to update wallet.");
    }
  };

  const filteredGyms = gyms.filter(g => 
    (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '600px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1e293b' }}>Manage Gyms</h2>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <FiSearch color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search gyms by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '250px' }}
            />
          </div>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FiPlus /> Add Gym
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Gym Name</th>
              <th>Email / Phone</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Expiry Date</th>
              <th>Wallet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>Loading...</td></tr>
            ) : filteredGyms.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>No gyms found.</td></tr>
            ) : (
              filteredGyms.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td style={{ fontWeight: 500 }}>{g.name}</td>
                  <td>
                    {g.email} <br />
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{g.phone}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${(g.subscription_status || 'trial').toLowerCase()}`}>
                      {g.subscription_status || 'Trial'}
                    </span>
                  </td>
                  <td>{g.subscription_plan || 'N/A'}</td>
                  <td>{g.subscription_ends_at ? new Date(g.subscription_ends_at).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ fontWeight: 'bold' }}>₹{g.wallet_balance || '0.00'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn edit" onClick={() => openEditModal(g)} title="Edit Subscription">
                        <FiEdit2 />
                      </button>
                      <button className="action-btn" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => openWalletModal(g)} title="Top-up Wallet">
                        <FiDollarSign />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Subscription Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Edit Subscription: {selectedGym?.name}</h2>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-body">
              <div className="form-group">
                <label>Subscription Status</label>
                <select 
                  className="form-control" 
                  value={formData.subscription_status} 
                  onChange={e => setFormData({...formData, subscription_status: e.target.value})}
                  required
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subscription Plan Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.subscription_plan} 
                  onChange={e => setFormData({...formData, subscription_plan: e.target.value})}
                  placeholder="e.g. Basic, Premium"
                />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.subscription_ends_at} 
                  onChange={e => setFormData({...formData, subscription_ends_at: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Top-up Modal */}
      {isWalletModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Wallet Top-up: {selectedGym?.name}</h2>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleWalletSubmit} className="modal-body">
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                Current Balance: <strong>₹{selectedGym?.wallet_balance || '0.00'}</strong>
              </div>
              <div className="form-group">
                <label>Amount to Add/Deduct (INR)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={walletForm.amount} 
                  onChange={e => setWalletForm({...walletForm, amount: e.target.value})}
                  placeholder="e.g. 500 (use -500 to deduct)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description / Note</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={walletForm.description} 
                  onChange={e => setWalletForm({...walletForm, description: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn-primary">Update Wallet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Gym Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Add New Gym</h2>
              <button className="close-btn" onClick={closeModals}>&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-body">
              <div className="form-group">
                <label>Gym Name</label>
                <input type="text" className="form-control" required value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" required value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" className="form-control" required value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" className="form-control" required value={createForm.address} onChange={e => setCreateForm({...createForm, address: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Admin Username</label>
                  <input type="text" className="form-control" required value={createForm.admin_username} onChange={e => setCreateForm({...createForm, admin_username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Admin Password</label>
                  <input type="password" className="form-control" required minLength="6" value={createForm.admin_password} onChange={e => setCreateForm({...createForm, admin_password: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModals}>Cancel</button>
                <button type="submit" className="btn-primary">Create Gym</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminGyms;
