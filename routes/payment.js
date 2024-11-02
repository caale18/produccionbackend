const express = require('express');
const router = express.Router();

const { 
    processPayment,
    sendPayPalApi
} = require('../controllers/paymentController');

const { isAuthenticatedUser } = require('../middlewares/auth');

router.route('/payment/process').post(isAuthenticatedUser, processPayment);
router.route('/paypalapi').get(isAuthenticatedUser, sendPayPalApi);

module.exports = router;
