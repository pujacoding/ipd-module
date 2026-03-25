const express = require('express');
const router = express.Router();

const controller = require('../controllers/authController');

router.post('/login', controller.login);
router.post('/request-otp', controller.requestOtp);
router.post('/verify-otp', controller.verifyOtp);

module.exports = router;
