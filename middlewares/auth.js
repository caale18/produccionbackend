const User = require('../models/user');
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");

// Verificar si el usuario está autenticado o no
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    let token = req.headers.authorization && req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies.token;

    if (!token) {
        return next(new ErrorHandler('Inicie sesión primero para acceder a este recurso.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    next();
});

// Manejando roles de los usuarios
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403));
        }
        next();
    };
};
