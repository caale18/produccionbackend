const User = require('../models/user');

const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");

// Verificar si el usuario esta autenticado o no
exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {

    const { token } = req.cookies

    if(!token) {
        return next(new ErrorHandler('Inicie sesion primero para acceder correctamente a este recurso.', 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id);

    next()

})

// Manejando roles de los usuarios
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403))
        }
        next()
    }
}