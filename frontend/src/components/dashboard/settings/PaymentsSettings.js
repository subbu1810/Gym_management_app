import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiCreditCard, FiKey, FiSettings, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../../services/api';

const PaymentsSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    enable_online_payment: true,
    enable_cash: true,
    enable_upi: true,
    upi_id: '',
    enable_bank_transfer: true,
    enable_card: true
  });

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getSettings();
      if (res.success && res.data) {
        const gym = res.data;
        setPaymentForm({
          razorpay_key_id: gym.razorpay_key_id || '',
          razorpay_key_secret: gym.razorpay_key_secret || '',
          enable_online_payment: gym.enable_online_payment ?? true,
          enable_cash: gym.enable_cash ?? true,
          enable_upi: gym.enable_upi ?? true,
          upi_id: gym.upi_id || '',
          enable_bank_transfer: gym.enable_bank_transfer ?? true,
          enable_card: gym.enable_card ?? true
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load payment configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsAPI.updatePayments(paymentForm);
      if (res.success) {
        toast.success('Payment settings updated successfully');
        loadPaymentSettings();
      }
    } catch (err) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading payment configurations...</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Razorpay Configurations Card */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <FiKey />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Online Payment Gateway (Razorpay)</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Configure API keys to accept automated online membership payments.</p>
          </div>
        </div>
        
        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Enable Online Payments</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Allow members to pay via card, UPI, or netbanking using Razorpay checkout.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_online_payment"
                checked={paymentForm.enable_online_payment} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {paymentForm.enable_online_payment && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <div className="settings-form-group">
                <label>Razorpay Key ID</label>
                <input 
                  type="text" 
                  name="razorpay_key_id"
                  className="settings-input" 
                  placeholder="rzp_test_..." 
                  value={paymentForm.razorpay_key_id}
                  onChange={handleInputChange}
                />
              </div>
              <div className="settings-form-group">
                <label>Razorpay Key Secret</label>
                <input 
                  type="password" 
                  name="razorpay_key_secret"
                  className="settings-input" 
                  placeholder="••••••••••••••••" 
                  value={paymentForm.razorpay_key_secret}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Payment Methods Card */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <FiCreditCard />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Manual Payment Methods</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Enable or disable payment options for counter payments in the gym.</p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Cash</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Accept paper currency directly.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_cash"
                checked={paymentForm.enable_cash} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>UPI (Manual QR)</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Allow direct scan to UPI ID/QR code.</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  name="enable_upi"
                  checked={paymentForm.enable_upi} 
                  onChange={handleInputChange} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {paymentForm.enable_upi && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>UPI ID</label>
                <input 
                  type="text" 
                  name="upi_id"
                  className="settings-input" 
                  placeholder="yourname@bank" 
                  value={paymentForm.upi_id}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Bank Transfer</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Record transfers to bank account.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_bank_transfer"
                checked={paymentForm.enable_bank_transfer} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Credit/Debit Card (POS)</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Accept payments via physical swiping machine.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_card"
                checked={paymentForm.enable_card} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '14px 28px', fontSize: '0.9rem' }}>
          <FiCheckSquare /> {saving ? 'Saving Settings...' : 'Save Payment Configurations'}
        </button>
      </div>
      
    </form>
  );
};

export default PaymentsSettings;
