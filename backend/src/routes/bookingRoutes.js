const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', bookingController.createBooking);
router.get('/', authMiddleware, bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', authMiddleware, bookingController.deleteBooking);

module.exports = router;
