//Creamos y enviamos el token y guardamos en la cookie
const sendToken = (user, statusCode, res) => {

    // Creamos Jwt token
    const token = user.getJwtToken();

    // Opciones para la cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }


    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    })

}

module.exports = sendToken;