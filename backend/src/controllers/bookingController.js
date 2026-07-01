const BookingModel = require('../models/bookingModel');

exports.createBooking = async (req, res) => {
    try {
        const { full_name, email, phone, plan_type, booking_date, gym_slot } = req.body;
        
        // Still doing basic validation for these core fields
        if (!full_name || !email || !phone || !plan_type || !booking_date || !gym_slot) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Pass the entire req.body to the model since it handles destructuring
        const bookingId = await BookingModel.create(req.body);
        res.status(201).json({ message: 'Booking created successfully', bookingId });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await BookingModel.findAll(req.query);
        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await BookingModel.findById(id);
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error('Get booking by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await BookingModel.update(id, req.body);
        if (success) {
            const booking = await BookingModel.findById(id);
            res.json({ message: 'Booking updated successfully', booking });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await BookingModel.delete(id);
        if (success) {
            res.json({ message: 'Booking deleted successfully' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
