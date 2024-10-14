const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');

const crypto = require('crypto')

//Registrar un usuario => /api/v1/register
exports.registerUser = catchAsyncErrors( async (req, res, next) => {

    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: '',
            url: ''
        }
    })

    sendToken(user, 200, res);
})

//Login User => /a[i/v1/login
exports.loginUser = catchAsyncErrors( async(req, res, next) => {
    const {email, password } = req.body;

    // Verificar si el correo y la password son ingresados por el user
    if(!email || !password) {
        return next(new ErrorHandler('Ingrese el correo y la password', 400))
    }

    //Usuario que busca en la base de datos\
    const user = await User.findOne({ email }).select('+password')

    if(!user) {
        return next(new ErrorHandler('El email o password no son validos', 401));
    }

    //Comprueba si la password es correcta o no
    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHandler('El email o password no son validos', 401));
    }

    sendToken(user, 200, res);
})

// Olvide la password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });

    if(!user) {
        return next(new ErrorHandler('Usuario no encontrado con este correo electronico', 404));
    }

    // Obten el token de reinicio
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false })

    //Creamos la URL para restablecer la password
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;

    const message = `Su token de restablecimiento de password es el siguiente:\n\n${resetUrl}\n\nSi no ha solicitado este correo electronico, entonces ignorelo.`

    try {

        await sendEmail({
            email: user.email,
            subject: 'Recuperacion de password',
            message
        })

        res.status(200).json({
            success: true,
            message: `Enviara por correo a: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpired = undefined;

        await user.save({ validateBeforeSave: false })

        return next(new ErrorHandler(error.message, 500))
    }
})

// Restablece la password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')


    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpired: { $gt: Date.now() }
    })

    if(!user) {
        return next(new ErrorHandler('El token de restablecimiento de la password no es valida o ha caducado', 400))
    }

    if(req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password no coincide', 400))
    }

    // Configure la nueva password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpired = undefined;

    await user.save();

    sendToken(user, 200, res)

})

// Obtener los detalles del usuario actualmente registrados => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
})

// Update / Change password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Verifique la password del usuario anterior
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if(!isMatched) {
        return next(new ErrorHandler('La password anterior es incorrecta', 400))
    }

    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res)

})

// Actualizar el perfil de usuario => /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // Actualizar avatar: TODO

    const user = await User.findByIdAndUpdate(req.user.id, newUserData , {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

// Cerrar sesion user => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Se cerro la sesion'
    })
})

// Admin Routes

// Obtener todos los usuarios => /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})


// Obtener detalles del usuario => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`El usuario no se encuentra con id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
})

// Actualizar el perfil de usuario => /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData , {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

// Eliminar Usuario => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`El usuario no se encuentra con id: ${req.params.id}`))
    }

    // Eliminar el avatar de Cloudinary - TODO

    await user.deleteOne();

    res.status(200).json({
        success: true,
    })
})

