const BookingModel = require('../models/bookingModel');
const notificationService = require('../services/notificationService');

exports.createOrder = async (req, res) => {
    const { amount, currency, bookingId } = req.body;

    try {
        // Update existing booking directly without razorpay
        await BookingModel.update(bookingId, {
            amount,
            payment_status: 'Pending',
            terms_accepted: true,
        });

        res.json({
            success: true,
            order: { id: `order_mock_${Date.now()}`, amount: amount * 100, currency: currency || "INR" },
            bookingId
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    const { bookingId } = req.body;

    try {
        // Update booking status directly without razorpay verification
        await BookingModel.update(bookingId, { 
            payment_status: 'Success', 
            status: 'Confirmed'
        });

        // Fetch booking details to send notification
        const booking = await BookingModel.findById(bookingId);

        if (booking) {
            // Send Notifications (Fire and forget, or await depending on requirement)
            notificationService.sendEmailNotification(booking).catch(err => console.error('Email Error:', err));
            notificationService.sendWhatsAppNotification(booking).catch(err => console.error('WA Error:', err));
        }

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
