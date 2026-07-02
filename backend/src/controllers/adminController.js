const BookingModel = require('../models/bookingModel');

exports.getDashboardStats = async (req, res) => {
    try {
        const bookings = await BookingModel.findAll();
        
        let totalUsers = new Set();
        let totalBookings = bookings.length;
        let paymentSuccess = 0;
        let paymentFailed = 0;
        let paymentPending = 0;
        let revenue = 0;
        let totalAmount = 0;

        bookings.forEach(b => {
            totalUsers.add(b.email);
            totalAmount += parseFloat(b.amount || 0);
            if (b.payment_status === 'Success') {
                paymentSuccess++;
                revenue += parseFloat(b.amount || 0);
            } else if (b.payment_status === 'Failed') {
                paymentFailed++;
            } else {
                paymentPending++;
            }
        });

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers.size,
                totalBookings: totalBookings,
                paymentSuccess: paymentSuccess,
                paymentFailed: paymentFailed,
                paymentPending: paymentPending,
                revenue: revenue,
                totalAmount: totalAmount,
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
};
