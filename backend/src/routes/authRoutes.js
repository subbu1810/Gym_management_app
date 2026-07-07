const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.adminLogin);

router.post('/forgot-password/request-otp', authController.requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', authController.verifyPasswordResetOtp);
router.post('/forgot-password/reset', authController.resetAdminPassword);

module.exports = router;
