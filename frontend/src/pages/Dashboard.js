import React, { useEffect, useState } from 'react';
import { bookingsAPI, adminAPI } from '../services/api';
import { CSVLink } from 'react-csv';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import '../styles/AdminDashboard.css';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');

  const [gymNameInput, setGymNameInput] = useState(localStorage.getItem('gymName') || 'POWER GYM');
  const [gymLogoInput, setGymLogoInput] = useState(localStorage.getItem('gymLogo') || '');
  const [gymImage1Input, setGymImage1Input] = useState(localStorage.getItem('gymImage1') || '');
  const [gymImage2Input, setGymImage2Input] = useState(localStorage.getItem('gymImage2') || '');
  const [gymImage3Input, setGymImage3Input] = useState(localStorage.getItem('gymImage3') || '');
  const [gymAddressInput, setGymAddressInput] = useState(localStorage.getItem('gymAddress') || 'Maski Road Sindhanur-584128');
  const [gymEmailInput, setGymEmailInput] = useState(localStorage.getItem('gymEmail') || 'contact@powergym.com');
  const [gymMobileInput, setGymMobileInput] = useState(localStorage.getItem('gymMobile') || '9893457839');
  const [gymHoursMonFriInput, setGymHoursMonFriInput] = useState(localStorage.getItem('gymHoursMonFri') || '5:00 AM - 11:00 PM');
  const [gymHoursSatSunInput, setGymHoursSatSunInput] = useState(localStorage.getItem('gymHoursSatSun') || '7:00 AM - 9:00 PM');

  const [feeMonthlyInput, setFeeMonthlyInput] = useState(localStorage.getItem('feeMonthly') || '1500');
  const [fee3MonthsInput, setFee3MonthsInput] = useState(localStorage.getItem('fee3Months') || '4500');
  const [fee6MonthsInput, setFee6MonthsInput] = useState(localStorage.getItem('fee6Months') || '9000');
  const [feeYearlyInput, setFeeYearlyInput] = useState(localStorage.getItem('feeYearly') || '18000');

  const [gymTermsInput, setGymTermsInput] = useState(localStorage.getItem('gymTerms') || '');

  const uniqueUsers = Array.from(new Map(bookings.map(item => [item.email, item])).values())
    .filter(user => {
      const fullName = user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.phone.includes(userSearchTerm);
    });


  const filteredPayments = bookings.filter(booking => {
    const statusMatch = paymentFilter === 'All' ? true : (booking.payment_status || 'Pending') === paymentFilter;
    if (!statusMatch) return false;

    if (!paymentSearchTerm) return true;

    const fullName = booking.full_name || `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
    return fullName.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
      (booking.email && booking.email.toLowerCase().includes(paymentSearchTerm.toLowerCase())) ||
      (booking.phone && booking.phone.includes(paymentSearchTerm));
  });

  useEffect(() => {
    fetchBookings();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      const data = await bookingsAPI.getAll({ name: searchTerm, status: statusFilter });
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="delete-toast-container">
        <div className="delete-toast-icon">⚠️</div>
        <p className="delete-toast-title">Confirm Deletion</p>
        <p className="delete-toast-text">Are you absolutely sure you want to delete this booking? This action cannot be undone.</p>
        <div className="delete-toast-actions">
          <button onClick={() => {
            toast.dismiss(t.id);
            confirmDelete(id);
          }} className="delete-toast-btn-yes">Yes, Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="delete-toast-btn-cancel">Cancel</button>
        </div>
      </div>
    ), {
      duration: Infinity,
      id: 'delete-confirm-toast',
      className: 'delete-confirm-toast-style'
    });
  };

  const confirmDelete = async (id) => {
    try {
      await bookingsAPI.delete(id);
      fetchBookings(); // Refresh
      fetchStats();
      toast.success('Deleted Successfully', {
        className: 'success-toast-style'
      });
    } catch (error) {
      console.error('Failed to delete booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updateData = { status: newStatus };

      if (newStatus === 'Confirmed' || newStatus === 'Active') {
        updateData.payment_status = 'Success';
      } else if (newStatus === 'Cancelled') {
        updateData.payment_status = 'Failed';
      } else if (newStatus === 'Pending') {
        updateData.payment_status = 'Pending';
      }

      await bookingsAPI.update(id, updateData);

      setBookings(prevBookings => prevBookings.map(b => b.id === id ? { ...b, ...updateData } : b));
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => ({ ...prev, ...updateData }));
      }

      fetchBookings();
      fetchStats();
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleViewDetails = async (booking) => {
    // Show immediate partial data while fetching full data (for responsiveness)
    setSelectedBooking({ ...booking, isLoading: true });
    try {
      const fullBooking = await bookingsAPI.getById(booking.id);
      setSelectedBooking({ ...fullBooking, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch full booking details:', error);
      setSelectedBooking({ ...booking, isLoading: false });
      toast.error('Failed to load full user details');
    }
  };

  const generateReceipt = (booking) => {
    toast('Receipt page coming soon.....', {
      icon: '⏳',
      duration: 3000,
      className: 'receipt-toast-style',
    });
  };

  const headers = [
    { label: "ID", key: "id" },
    { label: "Name", key: "full_name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Plan", key: "plan_type" },
    { label: "Date", key: "booking_date" },
    { label: "Slot", key: "gym_slot" },
    { label: "Status", key: "status" },
    { label: "Payment", key: "payment_status" }
  ];

  const getExpiryStatus = (bookingDate, planType) => {
    if (!bookingDate || !planType) return null;
    const start = new Date(bookingDate);
    if (isNaN(start.getTime())) return null;

    let end = new Date(start);
    if (planType === 'Monthly') end.setMonth(end.getMonth() + 1);
    else if (planType === '3 Months') end.setMonth(end.getMonth() + 3);
    else if (planType === '6 Months') end.setMonth(end.getMonth() + 6);
    else if (planType === 'Yearly') end.setFullYear(end.getFullYear() + 1);
    else return null;

    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', text: 'Expired' };
    if (diffDays <= 10) return { status: 'expiring', text: `Expiring in ${diffDays} day${diffDays !== 1 ? 's' : ''}` };
    return null;
  };
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('gymName', gymNameInput);
      localStorage.setItem('gymLogo', gymLogoInput);
      localStorage.setItem('gymImage1', gymImage1Input);
      localStorage.setItem('gymImage2', gymImage2Input);
      localStorage.setItem('gymImage3', gymImage3Input);
      localStorage.setItem('gymAddress', gymAddressInput);
      localStorage.setItem('gymEmail', gymEmailInput);
      localStorage.setItem('gymMobile', gymMobileInput);
      localStorage.setItem('gymHoursMonFri', gymHoursMonFriInput);
      localStorage.setItem('gymHoursSatSun', gymHoursSatSunInput);
      localStorage.setItem('feeMonthly', feeMonthlyInput);
      localStorage.setItem('fee3Months', fee3MonthsInput);
      localStorage.setItem('fee6Months', fee6MonthsInput);
      localStorage.setItem('feeYearly', feeYearlyInput);
      localStorage.setItem('gymTerms', gymTermsInput);

      // Dispatch a custom event to notify other components in the same tab
      window.dispatchEvent(new Event('gymSettingsUpdated'));

      toast.success('Gym settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error.name === 'QuotaExceededError' || error.message.includes('Quota')) {
        toast.error('Failed to save: Browser storage is completely FULL. Please clear your bookings or use a smaller logo.');
      } else {
        toast.error('Failed to save settings. Please try again.');
      }
    }
  };

  const handleGenericImageUpload = (e, setInputFunc) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setInputFunc(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Fill white background in case of transparent image
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.1);
          setGymLogoInput(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`dashboard-container ${theme === 'light' ? 'light-theme' : ''}`}>
      <div className="dashboard-top-header">
        <h2>Admin Dashboard</h2>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>

      {stats && (
        <div className="stats-container">
          <div
            className={`stat-card stat-users clickable ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <h3>Total Users</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div
            className={`stat-card stat-bookings clickable ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <h3>Total Bookings</h3>
            <p className="stat-value">{stats.totalBookings}</p>
          </div>
          <div
            className="stat-card stat-revenue clickable"
            onClick={() => { setActiveTab('payments'); setPaymentFilter('Success'); }}
          >
            <h3>Success Amount</h3>
            <p className="stat-value">Rs. {stats.revenue}</p>
            <p className="stat-subtext" style={{ margin: '5px 0' }}>Total Amount: Rs. {stats.totalAmount}</p>
            <p className="stat-subtext">{stats.paymentSuccess} Successful Payments</p>
          </div>
          <div
            className={`stat-card stat-payments clickable ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <h3>Total Payments</h3>
            <p className="stat-value">{stats.paymentSuccess + stats.paymentFailed + stats.paymentPending}</p>
          </div>
          <div
            className={`stat-card stat-settings clickable ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <h3>Gym Settings</h3>
            <p className="stat-value">⚙️</p>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <>
          <h3>Bookings</h3>

          <div className="dashboard-header-controls">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <CSVLink data={bookings} headers={headers} filename="bookings.csv" className="btn btn-export-csv">
              Export CSV
            </CSVLink>
          </div>

          <div className="booking-table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Plan Type</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Booking Status</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>
                      {booking.full_name || `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'N/A'}
                      {(() => {
                        const exp = getExpiryStatus(booking.booking_date || booking.joining_date, booking.plan_type);
                        if (exp && exp.status === 'expiring') {
                          return <span className="badge badge-expiring" title="Expiring soon">{exp.text}</span>;
                        }
                        if (exp && exp.status === 'expired') {
                          return <span className="badge badge-expired" title="Plan expired">{exp.text}</span>;
                        }
                        return null;
                      })()}
                    </td>
                    <td>{booking.plan_type}</td>
                    <td>{booking.booking_date || booking.joining_date}</td>
                    <td>{booking.gym_slot}</td>
                    <td>
                      <select value={booking.status} onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <span className={`payment-status payment-${(booking.payment_status || 'pending').toLowerCase()}`}>
                        {booking.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleViewDetails(booking)} className="action-btn">View</button>
                      <button onClick={() => generateReceipt(booking)} className="action-btn btn-receipt">Receipt</button>
                      <button onClick={() => handleDelete(booking.id)} className="action-btn btn-delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <>
          <h3>Users List</h3>
          <div className="dashboard-header-controls">
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="booking-table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uniqueUsers.map((user, idx) => (
                  <tr key={idx}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{user.age || 'N/A'}</td>
                    <td>{user.gender || 'N/A'}</td>
                    <td>{user.city || 'N/A'}</td>
                    <td>
                      <button onClick={() => handleViewDetails(user)} className="action-btn">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'payments' && (
        <>
          <h3>Payments List</h3>
          <div className="dashboard-header-controls">
            <input
              type="text"
              placeholder="Search payments by name, email, or phone..."
              value={paymentSearchTerm}
              onChange={(e) => setPaymentSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="filter-select">
              <option value="All">All Payments</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="booking-table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User Name</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, idx) => (
                  <tr key={idx}>
                    <td>{payment.id}</td>
                    <td>{payment.full_name || `${payment.firstName || ''} ${payment.lastName || ''}`.trim() || 'N/A'}</td>
                    <td>Rs. {payment.amount}</td>
                    <td>
                      <span className={`payment-status payment-${(payment.payment_status || 'pending').toLowerCase()}`}>
                        {payment.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleViewDetails(payment)} className="action-btn">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="settings-container" style={{ padding: '10px 15px', background: 'var(--card-bg)', borderRadius: '8px', marginTop: '10px' }}>
          <h3>Gym Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Name</label>
              <input
                type="text"
                value={gymNameInput}
                onChange={(e) => setGymNameInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Address</label>
              <textarea
                value={gymAddressInput}
                onChange={(e) => setGymAddressInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', minHeight: '40px', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Email</label>
              <input
                type="email"
                value={gymEmailInput}
                onChange={(e) => setGymEmailInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Mobile Number</label>
              <input
                type="text"
                value={gymMobileInput}
                onChange={(e) => setGymMobileInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Hours (Mon-Fri)</label>
              <input
                type="text"
                value={gymHoursMonFriInput}
                onChange={(e) => setGymHoursMonFriInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Hours (Sat-Sun)</label>
              <input
                type="text"
                value={gymHoursSatSunInput}
                onChange={(e) => setGymHoursSatSunInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Fee (Monthly)</label>
              <input
                type="number"
                value={feeMonthlyInput}
                onChange={(e) => setFeeMonthlyInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Fee (3 Months)</label>
              <input
                type="number"
                value={fee3MonthsInput}
                onChange={(e) => setFee3MonthsInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Fee (6 Months)</label>
              <input
                type="number"
                value={fee6MonthsInput}
                onChange={(e) => setFee6MonthsInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Fee (Yearly)</label>
              <input
                type="number"
                value={feeYearlyInput}
                onChange={(e) => setFeeYearlyInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="search-input"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
              {gymLogoInput && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ marginBottom: '4px', fontSize: '0.85rem' }}>Current Logo:</p>
                  <img src={gymLogoInput} alt="Gym Logo Preview" style={{ height: '80px', objectFit: 'contain', borderRadius: '5px', background: '#fff', padding: '5px' }} />
                  <button
                    onClick={() => setGymLogoInput('')}
                    className="action-btn btn-delete"
                    style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Image 1</label>
              <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, setGymImage1Input)} className="search-input" style={{ width: '100%', fontSize: '0.85rem' }} />
              {gymImage1Input && (
                <div style={{ marginTop: '10px' }}>
                  <img src={gymImage1Input} alt="Gym Image 1 Preview" style={{ height: '80px', objectFit: 'contain', borderRadius: '5px', background: '#fff', padding: '5px' }} />
                  <button onClick={() => setGymImage1Input('')} className="action-btn btn-delete" style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', padding: '4px 8px' }}>Remove Image 1</button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Image 2</label>
              <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, setGymImage2Input)} className="search-input" style={{ width: '100%', fontSize: '0.85rem' }} />
              {gymImage2Input && (
                <div style={{ marginTop: '10px' }}>
                  <img src={gymImage2Input} alt="Gym Image 2 Preview" style={{ height: '80px', objectFit: 'contain', borderRadius: '5px', background: '#fff', padding: '5px' }} />
                  <button onClick={() => setGymImage2Input('')} className="action-btn btn-delete" style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', padding: '4px 8px' }}>Remove Image 2</button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Image 3</label>
              <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, setGymImage3Input)} className="search-input" style={{ width: '100%', fontSize: '0.85rem' }} />
              {gymImage3Input && (
                <div style={{ marginTop: '10px' }}>
                  <img src={gymImage3Input} alt="Gym Image 3 Preview" style={{ height: '80px', objectFit: 'contain', borderRadius: '5px', background: '#fff', padding: '5px' }} />
                  <button onClick={() => setGymImage3Input('')} className="action-btn btn-delete" style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', padding: '4px 8px' }}>Remove Image 3</button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Gym Terms and Conditions</label>
              <textarea
                value={gymTermsInput}
                onChange={(e) => setGymTermsInput(e.target.value)}
                className="search-input"
                placeholder="Enter Terms and Conditions here. You can use multiple lines."
                style={{ width: '100%', minHeight: '150px', padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <button onClick={handleSaveSettings} className="btn btn-primary" style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '10px' }}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="modal-overlay">
          <div className="user-details-card">
            {/* Header Area */}
            <div className="modal-header">
              <button onClick={() => setSelectedBooking(null)} className="modal-close-btn">&times;</button>
              <div className="modal-avatar">
                {selectedBooking.profilePhoto || selectedBooking.profile_photo ? (
                  <img src={selectedBooking.profilePhoto || selectedBooking.profile_photo} alt="Profile" />
                ) : (
                  selectedBooking.full_name ? selectedBooking.full_name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <h3>{selectedBooking.full_name}</h3>
              <p>Booking #{selectedBooking.id}</p>
            </div>

            {/* Details Area */}
            <div className="modal-body">
              {[
                { label: 'Phone', value: selectedBooking.phone },
                { label: 'WhatsApp', value: selectedBooking.whatsappNumber },
                { label: 'Email', value: selectedBooking.email },
                { label: 'Plan Type', value: selectedBooking.plan_type },
                { label: 'Amount', value: `Rs. ${selectedBooking.amount || 0}` },
                { label: 'Booking Date', value: selectedBooking.booking_date || selectedBooking.joining_date || 'N/A' },
                { label: 'Gym Slot', value: selectedBooking.gym_slot },
                { label: 'Booking Status', value: selectedBooking.status, highlight: true },
                { label: 'Payment Status', value: selectedBooking.payment_status || 'Pending', highlight: true },
                { label: 'Age', value: selectedBooking.age },
                { label: 'Gender', value: selectedBooking.gender },
                { label: 'Date of Birth', value: selectedBooking.dateOfBirth },
                { label: 'Blood Group', value: selectedBooking.bloodGroup },
                { label: 'Height', value: selectedBooking.height },
                { label: 'Weight', value: selectedBooking.weight },
                { label: 'Medical Condition', value: selectedBooking.medical_condition },
                { label: 'Medical Details', value: selectedBooking.medical_details },
                { label: 'Occupation', value: selectedBooking.occupation },
                { label: 'Address', value: selectedBooking.address },
                { label: 'City', value: selectedBooking.city },
                { label: 'State', value: selectedBooking.state },
                { label: 'Pincode', value: selectedBooking.pincode },
                { label: 'Emergency Contact', value: selectedBooking.emergencyContactName },
                { label: 'Emergency Number', value: selectedBooking.emergencyContactNumber },
                { label: 'ID Proof Type', value: selectedBooking.idProofType },
                { label: 'ID Proof Number', value: selectedBooking.idProofNumber }
              ].map((item, idx) => (
                <div key={idx} className={`detail-item ${['Address', 'Medical Details'].includes(item.label) ? 'full-width' : ''}`}>
                  <span className="detail-label">{item.label}</span>
                  <div
                    className={`detail-value ${item.highlight ? 'highlight' : ''} ${item.highlight ? 'status-' + (item.value === 'Confirmed' || item.value === 'Success' ? 'success' : item.value === 'Cancelled' || item.value === 'Failed' ? 'failed' : 'pending') : ''}`}
                    title={item.value || 'N/A'}
                  >
                    {item.value || 'N/A'}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Area */}
            <div className="modal-footer">
              <button
                onClick={() => setSelectedBooking(null)}
                className="modal-close-action-btn"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default Dashboard;
