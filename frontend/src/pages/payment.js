import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../services/api';
import '../styles/global.css';
import '../styles/BookingForm.css';

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!bookingId) {
      toast.error("Invalid booking flow. Please start over.");
      return navigate('/');
    }

    setLoading(true);
    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        // Update booking status to Confirmed
        const response = await bookingsAPI.update(bookingId, { status: 'Confirmed' });
        navigate('/success', { state: { booking: response.booking } });
      } catch (error) {
        console.error("Payment finalization failed:", error);
        toast.error("Payment succeeded, but booking finalization failed. Please contact support.");
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="container form-container" style={{ maxWidth: '500px' }}>
      <h2 style={{ marginBottom: '1rem' }}>Complete Payment</h2>

      <form onSubmit={handlePayment}>
        <div className="form-group">
          <label>Cardholder Name</label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            required
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Card Number</label>
          <input
            type="text"
            name="cardNumber"
            placeholder="XXXX XXXX XXXX XXXX"
            required
            maxLength="16"
            value={formData.cardNumber}
            onChange={handleChange}
          />
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Expiry Date</label>
            <input
              type="text"
              name="expiry"
              placeholder="MM/YY"
              required
              maxLength="5"
              value={formData.expiry}
              onChange={handleChange}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>CVV</label>
            <input
              type="password"
              name="cvv"
              placeholder="123"
              required
              maxLength="3"
              value={formData.cvv}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ marginTop: '20px' }}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default Payment;
