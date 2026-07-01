const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard-stats', adminController.getDashboardStats);

module.exports = router;
