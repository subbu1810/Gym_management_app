import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiMail, FiMessageSquare, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../../services/api';

const IntegrationsSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [integrationForm, setIntegrationForm] = useState({
    twilio_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    enable_sms: false,
    enable_whatsapp: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_sender_email: '',
    smtp_sender_name: '',
    smtp_encryption: 'tls',
    enable_smtp: false,
    whatsapp_access_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_business_account_id: '',
    enable_whatsapp_meta: false,
    whatsapp_notify_new_customer: false,
    whatsapp_notify_payment_updated: false,
    whatsapp_notify_plan_expiring: false
  });

  useEffect(() => {
    loadIntegrationSettings();
  }, []);

  const loadIntegrationSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getSettings();
      if (res.success && res.data) {
        const gym = res.data;
        setIntegrationForm({
          twilio_sid: gym.twilio_sid || '',
          twilio_auth_token: gym.twilio_auth_token || '',
          twilio_phone_number: gym.twilio_phone_number || '',
          enable_sms: gym.enable_sms ?? false,
          enable_whatsapp: gym.enable_whatsapp ?? false,
          smtp_host: gym.smtp_host || '',
          smtp_port: gym.smtp_port ?? 587,
          smtp_username: gym.smtp_username || '',
          smtp_password: gym.smtp_password || '',
          smtp_sender_email: gym.smtp_sender_email || '',
          smtp_sender_name: gym.smtp_sender_name || '',
          smtp_encryption: gym.smtp_encryption || 'tls',
          enable_smtp: gym.enable_smtp ?? false,
          whatsapp_access_token: gym.whatsapp_access_token || '',
          whatsapp_phone_number_id: gym.whatsapp_phone_number_id || '',
          whatsapp_business_account_id: gym.whatsapp_business_account_id || '',
          enable_whatsapp_meta: gym.enable_whatsapp_meta ?? false,
          whatsapp_notify_new_customer: gym.whatsapp_notify_new_customer ?? false,
          whatsapp_notify_payment_updated: gym.whatsapp_notify_payment_updated ?? false,
          whatsapp_notify_plan_expiring: gym.whatsapp_notify_plan_expiring ?? false
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIntegrationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsAPI.updateIntegrations(integrationForm);
      if (res.success) {
        toast.success('Integration settings updated successfully');
        loadIntegrationSettings();
      }
    } catch (err) {
      toast.error('Failed to save integration settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading integrations settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Universal WhatsApp API Card */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <FiMessageSquare />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>WhatsApp Messaging Integration</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Enable automated WhatsApp messages using our Universal API. Messages are charged per send and deducted from your Wallet Balance.</p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Enable WhatsApp Automated Messaging</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Automatically send booking receipts and reminders to members. Requires sufficient wallet balance.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_whatsapp_meta"
                checked={integrationForm.enable_whatsapp_meta} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {integrationForm.enable_whatsapp_meta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px', background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Notification Preferences</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>Choose which events should trigger an automated WhatsApp message to your members.</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>New Customer Registration</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Send a welcome message when a new member joins.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="whatsapp_notify_new_customer"
                    checked={integrationForm.whatsapp_notify_new_customer} 
                    onChange={handleInputChange} 
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Payment Received / Updated</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Send an instant receipt when a payment is logged.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="whatsapp_notify_payment_updated"
                    checked={integrationForm.whatsapp_notify_payment_updated} 
                    onChange={handleInputChange} 
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>Membership Plan Expiring</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Send a reminder before a membership expires.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    name="whatsapp_notify_plan_expiring"
                    checked={integrationForm.whatsapp_notify_plan_expiring} 
                    onChange={handleInputChange} 
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS (Twilio) Card */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <FiSliders />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Twilio Integration (SMS)</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Configure Twilio gateway credentials to send automated SMS reminders and booking alerts.</p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', padding: '12px 16px', borderRadius: '10px', flex: 1, minWidth: '220px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Enable SMS Alerts</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Send member updates via text message.</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  name="enable_sms"
                  checked={integrationForm.enable_sms} 
                  onChange={handleInputChange} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {integrationForm.enable_sms && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
              <div className="settings-form-group">
                <label>Twilio Account SID</label>
                <input 
                  type="text" 
                  name="twilio_sid"
                  className="settings-input" 
                  placeholder="AC..." 
                  value={integrationForm.twilio_sid}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>Twilio Auth Token</label>
                <input 
                  type="password" 
                  name="twilio_auth_token"
                  className="settings-input" 
                  placeholder="••••••••••••••••••••••••••••••••" 
                  value={integrationForm.twilio_auth_token}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>Twilio Phone Number / Sender ID</label>
                <input 
                  type="text" 
                  name="twilio_phone_number"
                  className="settings-input" 
                  placeholder="+1..." 
                  value={integrationForm.twilio_phone_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMTP Email Integration Card */}
      <div className="chart-card" style={{ padding: '30px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <FiMail />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>SMTP Email Server Settings</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Connect your custom outbound email server to distribute professional HTML invoices and newsletters.</p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Enable Custom SMTP Server</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Route outgoing system emails through your own mail server instead of the system default.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                name="enable_smtp"
                checked={integrationForm.enable_smtp} 
                onChange={handleInputChange} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {integrationForm.enable_smtp && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
              <div className="settings-form-group">
                <label>SMTP Host</label>
                <input 
                  type="text" 
                  name="smtp_host"
                  className="settings-input" 
                  placeholder="smtp.mailgun.org" 
                  value={integrationForm.smtp_host}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>SMTP Port</label>
                <input 
                  type="number" 
                  name="smtp_port"
                  className="settings-input" 
                  placeholder="587" 
                  value={integrationForm.smtp_port}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>Encryption Type</label>
                <select 
                  name="smtp_encryption"
                  className="settings-select" 
                  value={integrationForm.smtp_encryption}
                  onChange={handleInputChange}
                >
                  <option value="none">None</option>
                  <option value="ssl">SSL</option>
                  <option value="tls">TLS</option>
                </select>
              </div>
              <div className="settings-form-group">
                <label>SMTP Username</label>
                <input 
                  type="text" 
                  name="smtp_username"
                  className="settings-input" 
                  placeholder="postmaster@yourdomain.com" 
                  value={integrationForm.smtp_username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>SMTP Password</label>
                <input 
                  type="password" 
                  name="smtp_password"
                  className="settings-input" 
                  placeholder="••••••••••••••••" 
                  value={integrationForm.smtp_password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group">
                <label>Sender Display Name</label>
                <input 
                  type="text" 
                  name="smtp_sender_name"
                  className="settings-input" 
                  placeholder="Power Gym Support" 
                  value={integrationForm.smtp_sender_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="settings-form-group" style={{ gridColumn: 'span 2' }}>
                <label>Sender Email Address</label>
                <input 
                  type="email" 
                  name="smtp_sender_email"
                  className="settings-input" 
                  placeholder="noreply@powergym.com" 
                  value={integrationForm.smtp_sender_email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '14px 28px', fontSize: '0.9rem' }}>
          <FiCheckSquare /> {saving ? 'Saving Integrations...' : 'Save API Integrations'}
        </button>
      </div>

    </form>
  );
};

export default IntegrationsSettings;
