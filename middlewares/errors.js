const ErrorHandler = require('../utils/errorHandler');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    
    if(process.env.NODE_ENV === 'DEVELOPMENT') {
        res.status(err.statusCode).json ({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack
        })
    }

    if(process.env.NODE_ENV === 'PRODUCTION') {
        let error = {...err}

        error.message = err.message;

        //Error de identificación de Mongoose ID
        if(err.name === 'CastError') {
            const message = `Resource not found. Invalid: ${err.path}`
            error = new ErrorHandler(message, 400)
        }

        //Manejo Mongoose Validation Error
        if(err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(value => value.message);
            error = new ErrorHandler(message, 400)
        }

        // Manejar error de clave duplicada Mongoose

        if(err.code === 11000) {
            const message = `Duplicate ${Object.keys(err.keyValue)} entered`
            error = new ErrorHandler(message, 400)
        }

        // Manejo del error JWT incorrecto
        if(err.name === 'JsonWebTokenError') {
            const message = 'JSON Web Token es invalido. Intentelo de nuevo!!!'
            error = new ErrorHandler(message, 400)
        }

        // Manejo del error JWT expirado
        if(err.name === 'TokenExpiredError') {
            const message = 'JSON Web Token esta caducado. Intentelo de nuevo!!!'
            error = new ErrorHandler(message, 400)
        }


        res.status(error.statusCode).json({
            success: false,
            message: error.message || 'Internal Server Error'
        })
    }
}