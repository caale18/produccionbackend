const catchAsyncError = require('../middlewares/catchAsyncErrors');
const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/order');

// Configuración de PayPal
const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_KEY);
const client = new paypal.core.PayPalHttpClient(environment);

// Procesar el pago y crear la orden en la base de datos
exports.processPayment = catchAsyncError(async (req, res, next) => {
    const { orderId, paymentStatus } = req.body;

    // Verifica que el pago esté completado
    if (paymentStatus !== 'COMPLETED') {
        return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        orderId
    });
});

exports.sendPayPalApi = catchAsyncError(async (req, res, next) => {
    res.status(200).json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID
    });
});


