import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/global.css';
import '../styles/BookingForm.css';
import { bookingsAPI, paymentsAPI } from '../services/api';

const Terms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    if (!accepted || !bookingId) {
      if (!bookingId) {
        toast.error("Invalid booking flow. Please start over.");
        navigate('/');
      }
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch booking details to get amount etc.
      const booking = await bookingsAPI.getById(bookingId);
      if (!booking) throw new Error("Booking not found");

      // Calculate amount based on plan
      let amount = parseInt(localStorage.getItem('feeMonthly') || '1500', 10);
      if (booking.plan_type === '3 Months') amount = parseInt(localStorage.getItem('fee3Months') || '4500', 10);
      if (booking.plan_type === '6 Months') amount = parseInt(localStorage.getItem('fee6Months') || '9000', 10);
      if (booking.plan_type === 'Yearly') amount = parseInt(localStorage.getItem('feeYearly') || '18000', 10);

      // 2. Create Order
      const orderData = await paymentsAPI.createOrder({
        amount: amount,
        currency: "INR",
        bookingId: bookingId,
      });

      if (!orderData.success) {
        toast.error("Server error. Please try again.");
        setLoading(false);
        return;
      }

      // Simulate some processing delay
      toast.success("Processing Payment...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Verify Payment
      const verifyRes = await paymentsAPI.verify({
        bookingId: orderData.bookingId
      });

      if (verifyRes.success) {
        toast.success("Payment completed successfully!");
        navigate('/success', { state: { booking: booking } });
      } else {
        toast.error("Payment verification failed!");
      }

    } catch (error) {
      console.error("Payment failed:", error);
      toast.error(`Failed to process payment. Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page-wrapper">
      <div className="container form-container">
        <h1 style={{ color: '#ff3333', textAlign: 'center', fontSize: '3rem', marginBottom: '30px' }}>Terms and Conditions</h1>

        <div style={{
          background: 'transparent', padding: '0',
          border: 'none',
          marginBottom: '30px', lineHeight: '1.8', fontSize: '1.1rem'
        }}>
          {localStorage.getItem('gymTerms') ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {localStorage.getItem('gymTerms')}
            </div>
          ) : (
            <>
              <h3 style={{ marginTop: '0' }}>1. Membership & Access</h3>
              <p style={{ marginBottom: '20px' }}>Members must present a valid booking confirmation for entry. Access is limited to the selected time slot and plan duration. The gym reserves the right to deny entry if terms are violated. Membership cards or QR codes are non-transferable and can only be used by the registered member.</p>

              <h3>2. Payments & Refunds</h3>
              <p style={{ marginBottom: '20px' }}>All payments are final and non-refundable. Refunds are only issued in the event of an unexpected gym closure lasting more than 3 consecutive days. Members are responsible for ensuring that their payment methods are valid and that dues are paid on time to avoid late fees or suspension of access.</p>

              <h3>3. Code of Conduct</h3>
              <p style={{ marginBottom: '20px' }}>Members are expected to respect staff and other members. Re-rack all weights and wipe down machines after use. Aggressive behavior, harassment, or inappropriate language will not be tolerated and may result in immediate termination of membership without a refund.</p>

              <h3>4. Health & Safety</h3>
              <p style={{ marginBottom: '20px' }}>Members must disclose any pre-existing medical conditions that may affect their ability to exercise safely. If you feel unwell, dizzy, or experience pain during a workout, please stop immediately and seek medical attention. The gym strongly recommends consulting a physician before starting any new fitness program.</p>

              <h3>5. Personal Training & Classes</h3>
              <p style={{ marginBottom: '20px' }}>Only gym-authorized personal trainers are permitted to provide training services on the premises. Unauthorized solicitation of personal training services is strictly prohibited. Group classes require advance booking and have limited capacity; cancellations must be made at least 24 hours in advance.</p>

              <h3>6. Liability Waiver</h3>
              <p style={{ marginBottom: '20px' }}>The gym is not responsible for any personal injuries, accidents, or lost items on the premises. By accepting these terms, you agree to use all equipment and facilities at your own risk and release the gym, its owners, and staff from any liability claims.</p>
              
              <h3>7. Termination of Membership</h3>
              <p style={{ marginBottom: '20px' }}>The gym reserves the right to terminate or suspend a membership at any time for violation of these terms and conditions, failure to pay dues, or behavior deemed harmful to the gym environment. Members may cancel their subscription by providing a 30-day written notice.</p>
            </>
          )}
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', justifyContent: 'center' }}>
          <input
            type="checkbox"
            id="accept-terms"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ width: '25px', height: '25px', cursor: 'pointer' }}
          />
          <label htmlFor="accept-terms" style={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
            I have read and accept the Terms and Conditions
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleProceed}
            className="btn"
            disabled={!accepted || loading}
            style={{
              opacity: accepted && !loading ? 1 : 0.5,
              cursor: accepted && !loading ? 'pointer' : 'not-allowed',
              marginTop: '0'
            }}
          >
            {loading ? 'Processing Payment...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
