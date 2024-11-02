const Order = require('../models/order');
const Product = require('../models/product');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');


// Creamos un nuevo orden => /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        orderId,
        shippingInfo,
        orderItems,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo: {
            id: orderId,
            status: 'COMPLETED',  // Configura el estado como completado si el pago fue exitoso
        },
        paidAt: Date.now(),
        user: req.user.id,
    });

    res.status(200).json({
        success: true,
        message: "Order has been placed successfully",
        order
    })
})


// Obtener un solo pedido => /api/v1/order/:id
exports.getSingleOrder = catchAsyncErrors( async(req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')

    if(!order) {
        return next(new ErrorHandler('No se encontro el pedido con esta ID', 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

// Iniciar sesion en los pedidos de los usuarios  => /api/v1/orders/me
exports.myOrders = catchAsyncErrors( async(req, res, next) => {
    const orders = await Order.find({ user: req.user.id })

    res.status(200).json({
        success: true,
        orders
    })
})

// Obtener todos los pedidos - ADMIN => /api/v1/admin/orders
exports.allOrders = catchAsyncErrors( async(req, res, next) => {
    const orders = await Order.find()

    let totalAmount = 0;
    orders.forEach(order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

// Actualizar / procesar los pedidos - ADMIN => /api/v1/admin/order/:id
exports.updateOrder = catchAsyncErrors( async(req, res, next) => {
    const order = await Order.findById(req.params.id)

    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('Ya has entregado este pedido', 400))
    }

    order.orderItems.forEach(async item => {
        await updateStock(item.product, item.quantity)
    })

    order.orderStatus = req.body.status,
        order.deliveredAt = Date.now()

    await order.save()

    res.status(200).json({
        success: true,
    })
})

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

// Eliminar pedido => /api/v1/admin/order/:id
exports.deleteOrder = catchAsyncErrors( async(req, res, next) => {
    const order = await Order.findById(req.params.id)

    if(!order) {
        return next(new ErrorHandler('No se encontro el pedido con esta ID', 404))
    }

    await order.deleteOne();

    res.status(200).json({
        success: true
    })
})