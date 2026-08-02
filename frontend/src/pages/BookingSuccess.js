import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiTag, FiUser, FiPhone, FiClock, FiCalendar, FiPrinter, FiHome } from 'react-icons/fi';
import { FaCheckCircle, FaCheck, FaDumbbell } from 'react-icons/fa';
import '../styles/BookingSuccess.css';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const member = location.state?.member || location.state?.booking;

  const handlePrint = () => {
    window.print();
  };

  const storedGymName = localStorage.getItem('gymName') || 'FITFLEX GYMS';
  const nameParts = storedGymName.split(' ');
  const firstWord = nameParts[0];
  const restOfName = nameParts.slice(1).join(' ');

  return (
    <div className="success-page-wrapper">
      <div className="success-card">
        <div className="success-content">
          <div className="brand-logo" style={{ color: 'red' }}>
            {firstWord}<span>{restOfName}</span>
          </div>

          <div className="success-header-row">
            <h1 className="success-title">Payment Successful!</h1>
            <div className="success-icon-badge">
              <FaCheck />
            </div>
          </div>

          <p className="success-subtitle">Thank you for your payment. Your registration has been confirmed!</p>

          {member && (
            <p className="success-email-text">
              We have sent a confirmation email to <strong>{member.email}</strong>.
            </p>
          )}

          {member && (
            <div className="receipt-card">
              <div className="receipt-header">REGISTRATION RECEIPT</div>
              <div className="receipt-body">
                <div className="receipt-item">
                  <FiTag className="receipt-icon" />
                  <span><strong>Member ID:</strong> #{member.id}</span>
                </div>
                <div className="receipt-item">
                  <span className="status-pill">
                    Status <FaCheckCircle /> {member.status}
                  </span>
                </div>
                <div className="receipt-item">
                  <FiUser className="receipt-icon" />
                  <span><strong>Name:</strong> {member.full_name}</span>
                </div>
                <div className="receipt-item">
                  <FaDumbbell className="receipt-icon" />
                  <span><strong>Plan Type:</strong> {member.plan_type}</span>
                </div>
                <div className="receipt-item">
                  <FiPhone className="receipt-icon" />
                  <span><strong>Phone:</strong> {member.phone}</span>
                </div>
                <div className="receipt-item">
                  <FiClock className="receipt-icon" />
                  <span><strong>Gym Slot:</strong> {member.gym_slot}</span>
                </div>
                <div className="receipt-item">
                  <FiCalendar className="receipt-icon" />
                  <span><strong>Date:</strong> {member.join_date || member.created_at?.substring(0,10)}</span>
                </div>
              </div>
              <div className="receipt-footer-text">
                Review your workout plan details to give the access your spans to your workout plan send.
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button onClick={handlePrint} className="btn-print">
              <FiPrinter /> Print Receipt
            </button>
            <button onClick={() => navigate('/')} className="btn-home">
              <FiHome /> Return Home
            </button>
          </div>

          <p className="footer-note">Please Download your Receipt. Thank you for choosing {storedGymName}!</p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
