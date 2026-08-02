import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiPercent, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../../services/api';

const TaxSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [taxForm, setTaxForm] = useState({
    tax_name: 'GST',
    tax_rate: 0.00,
    tax_registration_no: '',
    tax_calculation_type: 'exclusive',
    enable_tax: false
  });

  useEffect(() => {
    loadTaxSettings();
  }, []);

  const loadTaxSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getSettings();
      if (res.success && res.data) {
        const gym = res.data;
        setTaxForm({
          tax_name: gym.tax_name || 'GST',
          tax_rate: gym.tax_rate ?? 0.00,
          tax_registration_no: gym.tax_registration_no || '',
          tax_calculation_type: gym.tax_calculation_type || 'exclusive',
          enable_tax: gym.enable_tax ?? false
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tax settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaxForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsAPI.updateTax(taxForm);
      if (res.success) {
        toast.success('Tax settings updated successfully');
        loadTaxSettings();
      }
    } catch (err) {
      toast.error('Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading tax configurations...</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Tax configuration card */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f5f5f4', color: '#78716c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <FiPercent />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Taxation & GST Settings</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Configure tax name, percentage rates, and calculation types for billing.</p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Enable Tax / GST Calculation</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Apply specified tax rates automatically on newly created invoices and bookings.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_tax"
                checked={taxForm.enable_tax} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {taxForm.enable_tax && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <div className="settings-form-group">
                <label>Tax Name</label>
                <input 
                  type="text" 
                  name="tax_name"
                  className="settings-input" 
                  placeholder="GST, VAT, etc." 
                  value={taxForm.tax_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>Tax Rate (%)</label>
                <input 
                  type="number" 
                  name="tax_rate"
                  step="0.01"
                  min="0"
                  max="100"
                  className="settings-input" 
                  placeholder="e.g. 18.00" 
                  value={taxForm.tax_rate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>Tax Registration No / GSTIN</label>
                <input 
                  type="text" 
                  name="tax_registration_no"
                  className="settings-input" 
                  placeholder="e.g. 27AAAAA1111A1Z1" 
                  value={taxForm.tax_registration_no}
                  onChange={handleInputChange}
                />
              </div>
              <div className="settings-form-group">
                <label>Tax Calculation Type</label>
                <select 
                  name="tax_calculation_type"
                  className="settings-select" 
                  value={taxForm.tax_calculation_type}
                  onChange={handleInputChange}
                >
                  <option value="exclusive">Exclusive (Add tax on top of membership price)</option>
                  <option value="inclusive">Inclusive (Tax amount is already part of membership price)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '14px 28px', fontSize: '0.9rem' }}>
          <FiCheckSquare /> {saving ? 'Saving Settings...' : 'Save Tax Configurations'}
        </button>
      </div>

    </form>
  );
};

export default TaxSettings;
