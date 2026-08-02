import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiHome, FiSettings, FiBell, FiCreditCard, FiClock, FiDownload, FiShield, 
  FiMail, FiBox, FiServer, FiMapPin, FiStar, FiAward, FiUserCheck, FiUpload, FiCheckSquare, 
  FiCalendar, FiUserPlus, FiActivity, FiBarChart2 
} from 'react-icons/fi';
import '../../styles/dashboard/SettingsSection.css';
import PlansSettings from './settings/PlansSettings';
import TrainersSettings from './settings/TrainersSettings';
import PaymentsSettings from './settings/PaymentsSettings';
import TaxSettings from './settings/TaxSettings';
import BackupSettings from './settings/BackupSettings';
import IntegrationsSettings from './settings/IntegrationsSettings';
import SystemLogsSettings from './settings/SystemLogsSettings';
import WalletSettings from './settings/WalletSettings';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SettingsSection = ({ gymNameInput, gymLogoInput, activeSettingsTab }) => {
  const [loading, setLoading] = useState(false);
  
  // General settings state
  const [generalForm, setGeneralForm] = useState({
    name: 'Power Gym',
    email: 'info@powergym.com',
    phone: '+91 98765 43210',
    currency: 'Indian Rupee (₹)',
    date_format: '31 May 2024',
    time_format: '12 Hour (AM/PM)',
    timezone: '(GMT +05:30) Asia/Kolkata',
    language: 'English'
  });

  // Logo States
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  // Notification States
  const [notifications, setNotifications] = useState({
    new_bookings: true,
    membership_expiry: true,
    new_member: true,
    payment_received: true,
    payment_failed: true,
    attendance_alerts: true,
    member_checkin: true,
    trainer_schedule: false,
    system_alerts: false
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getSettings();
      if (res.success && res.data) {
        const gym = res.data;
        setGeneralForm({
          name: gym.name || 'Power Gym',
          email: gym.email || 'info@powergym.com',
          phone: gym.phone || '+91 98765 43210',
          currency: gym.currency || 'Indian Rupee (₹)',
          date_format: gym.date_format || '31 May 2024',
          time_format: gym.time_format || '12 Hour (AM/PM)',
          timezone: gym.timezone || '(GMT +05:30) Asia/Kolkata',
          language: gym.language || 'English'
        });
        setLogoUrl(gym.logo_path || '');
        if (gym.notification_settings) {
          setNotifications(prev => ({ ...prev, ...gym.notification_settings }));
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSettingsTab === 'general') {
      loadSettings();
    }
  }, [activeSettingsTab, loadSettings]);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      const res = await settingsAPI.updateSettings(generalForm);
      if (res.success) {
        toast.success('General settings saved successfully');
        loadSettings();
      }
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await settingsAPI.updateLogo(formData);
      if (res.success) {
        toast.success('Logo updated successfully');
        setLogoUrl(res.logo_url);
      }
    } catch (err) {
      toast.error('Failed to upload logo');
    }
  };

  const handleToggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    try {
      const res = await settingsAPI.updateNotifications({ notification_settings: notifications });
      if (res.success) {
        toast.success('Notification preferences updated');
      }
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px', width: '100%' }}>
      
      {/* MAIN SETTINGS AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {activeSettingsTab === 'general' && (
            <>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading settings details...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                    {/* General Settings Form */}
                    <form onSubmit={handleSaveGeneral} className="chart-card" style={{ padding: '30px' }}>
                      <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '4px' }}>General Settings</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '24px' }}>Manage your system preferences and configurations.</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          <div className="settings-form-group">
                            <label>Gym Name</label>
                            <input type="text" className="settings-input" value={generalForm.name} onChange={e => setGeneralForm(f => ({ ...f, name: e.target.value }))} />
                          </div>
                          <div className="settings-form-group">
                            <label>Gym Email</label>
                            <input type="email" className="settings-input" value={generalForm.email} onChange={e => setGeneralForm(f => ({ ...f, email: e.target.value }))} />
                          </div>
                          <div className="settings-form-group">
                            <label>Gym Phone</label>
                            <input type="text" className="settings-input" value={generalForm.phone} onChange={e => setGeneralForm(f => ({ ...f, phone: e.target.value }))} />
                          </div>
                          <div className="settings-form-group">
                            <label>Currency</label>
                            <select className="settings-select" value={generalForm.currency} onChange={e => setGeneralForm(f => ({ ...f, currency: e.target.value }))}>
                                <option>Indian Rupee (₹)</option>
                                <option>US Dollar ($)</option>
                                <option>Euro (€)</option>
                            </select>
                          </div>
                          <div className="settings-form-group">
                            <label>Date Format</label>
                            <select className="settings-select" value={generalForm.date_format} onChange={e => setGeneralForm(f => ({ ...f, date_format: e.target.value }))}>
                                <option>31 May 2024</option>
                                <option>MM/DD/YYYY</option>
                                <option>YYYY-MM-DD</option>
                            </select>
                          </div>
                          <div className="settings-form-group">
                            <label>Time Format</label>
                            <select className="settings-select" value={generalForm.time_format} onChange={e => setGeneralForm(f => ({ ...f, time_format: e.target.value }))}>
                                <option>12 Hour (AM/PM)</option>
                                <option>24 Hour</option>
                            </select>
                          </div>
                          <div className="settings-form-group">
                            <label>Timezone</label>
                            <select className="settings-select" value={generalForm.timezone} onChange={e => setGeneralForm(f => ({ ...f, timezone: e.target.value }))}>
                                <option>(GMT +05:30) Asia/Kolkata</option>
                            </select>
                          </div>
                          <div className="settings-form-group">
                            <label>Language</label>
                            <select className="settings-select" value={generalForm.language} onChange={e => setGeneralForm(f => ({ ...f, language: e.target.value }))}>
                                <option>English</option>
                                <option>Hindi</option>
                            </select>
                          </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                            <FiCheckSquare /> Save Profile Settings
                        </button>
                      </div>
                    </form>

                    {/* Gym Logo Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="chart-card" style={{ padding: '30px' }}>
                          <h3 style={{ fontSize: '0.9rem', marginTop: 0, marginBottom: '16px' }}>Gym Logo</h3>
                          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ color: '#f97316', fontSize: '2rem', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: 8, height: 16, background: '#f97316', borderRadius: 4, marginRight: 4}}></div><div style={{ width: 16, height: 16, background: '#f97316', borderRadius: '50%' }}></div><div style={{ width: 8, height: 16, background: '#f97316', borderRadius: 4, marginLeft: 4}}></div></div>
                                  </div>
                                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>POWER <span style={{ color: '#f97316' }}>GYM</span></div>
                                  <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '1px' }}>FITNESS FOR LIFE</div>
                                </div>
                            )}
                          </div>
                          <label style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', boxSizing: 'border-box' }}>
                            <FiUpload /> Change Logo
                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                          </label>
                          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '12px', marginBottom: 0 }}>JPG, PNG or SVG. Max size 2MB</p>
                      </div>
                    </div>
                </div>
              )}

              {/* Notification Settings */}
              <div className="chart-card" style={{ padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '4px' }}>Notification Settings</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Configure how you receive notifications.</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '30px' }}>
                    {/* Toggle Items */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiCalendar /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>New Bookings</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified when a new booking is made.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.new_bookings} onChange={() => handleToggleNotification('new_bookings')} /><span className="toggle-slider"></span></label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiUserCheck /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Membership Expiry</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified before membership expiry.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.membership_expiry} onChange={() => handleToggleNotification('membership_expiry')} /><span className="toggle-slider"></span></label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiUserPlus /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>New Member Registered</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified when a new member joins.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.new_member} onChange={() => handleToggleNotification('new_member')} /><span className="toggle-slider"></span></label>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiCreditCard /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Payment Received</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified for successful payments.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.payment_received} onChange={() => handleToggleNotification('payment_received')} /><span className="toggle-slider"></span></label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiCreditCard /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Payment Failed</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified for failed payments.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.payment_failed} onChange={() => handleToggleNotification('payment_failed')} /><span className="toggle-slider"></span></label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiClock /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Attendance Alerts</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified for attendance issues.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.attendance_alerts} onChange={() => handleToggleNotification('attendance_alerts')} /><span className="toggle-slider"></span></label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiBarChart2 /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Member Check-in</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified when member checks in.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.member_checkin} onChange={() => handleToggleNotification('member_checkin')} /><span className="toggle-slider"></span></label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiActivity /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Trainer Schedule</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Get notified about trainer schedules.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.trainer_schedule} onChange={() => handleToggleNotification('trainer_schedule')} /><span className="toggle-slider"></span></label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}><FiBell /></div>
                          <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>System Alerts</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Important system notifications.</div>
                          </div>
                        </div>
                        <label className="toggle-switch"><input type="checkbox" checked={notifications.system_alerts} onChange={() => handleToggleNotification('system_alerts')} /><span className="toggle-slider"></span></label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSaveNotifications} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.85rem' }}>
                        <FiCheckSquare /> Save Preferences
                    </button>
                  </div>
              </div>
            </>
          )}

          {activeSettingsTab === 'plans' && (
            <PlansSettings />
          )}

          {activeSettingsTab === 'trainers' && (
            <TrainersSettings />
          )}

          {activeSettingsTab === 'payments' && (
            <PaymentsSettings />
          )}

          {activeSettingsTab === 'tax' && (
            <TaxSettings />
          )}

          {activeSettingsTab === 'backup' && (
            <BackupSettings />
          )}

          {activeSettingsTab === 'integrations' && (
            <IntegrationsSettings />
          )}

          {activeSettingsTab === 'logs' && (
            <SystemLogsSettings />
          )}

          {activeSettingsTab === 'wallet' && (
            <WalletSettings />
          )}

          {activeSettingsTab !== 'general' && activeSettingsTab !== 'plans' && activeSettingsTab !== 'trainers' && activeSettingsTab !== 'payments' && activeSettingsTab !== 'tax' && activeSettingsTab !== 'backup' && activeSettingsTab !== 'integrations' && activeSettingsTab !== 'logs' && activeSettingsTab !== 'wallet' && (
            <div style={{ padding: '40px', background: '#fff', borderRadius: '16px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
              <h3>{activeSettingsTab.charAt(0).toUpperCase() + activeSettingsTab.slice(1)} Settings</h3>
              <p>This section is currently under construction. Please check back later.</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default SettingsSection;
