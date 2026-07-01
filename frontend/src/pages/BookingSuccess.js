import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container" style={{ maxWidth: '600px', padding: '20px', margin: '40px auto', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--success-color, #10b981)', marginBottom: '10px' }}>Payment Successful!</h2>
        <p style={{ fontSize: '1.1rem' }}>Thank you for your payment. Your booking has been confirmed!</p>
        {booking && (
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
            We have sent a confirmation email to <strong>{booking.email}</strong>.
          </p>
        )}
      </div>

      {booking && (
        <div className="receipt" style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '30px', textAlign: 'left' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>Booking Receipt</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: 'var(--text-primary)' }}>
            <p><strong>Booking ID:</strong> #{booking.id}</p>
            <p><strong>Status:</strong> <span style={{ color: 'var(--success-color, #10b981)', fontWeight: 'bold' }}>{booking.status}</span></p>
            <p><strong>Name:</strong> {booking.full_name}</p>
            <p><strong>Phone:</strong> {booking.phone}</p>
            <p><strong>Plan Type:</strong> {booking.plan_type}</p>
            <p><strong>Gym Slot:</strong> {booking.gym_slot}</p>
            <p><strong>Date:</strong> {booking.booking_date}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button onClick={handlePrint} className="btn" style={{ background: 'var(--text-secondary)' }}>Print Receipt</button>
        <button onClick={() => navigate('/')} className="btn">Return Home</button>
      </div>
    </div>
  );
};

export default BookingSuccess;
