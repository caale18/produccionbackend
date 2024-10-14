require("dotenv").config();
const app = require('./app')
const connectDatabase = require('./config/database')

// ese const de dotenv  no me sirve, solo necesito usar require(dotenv).config()
//const dotenv = require('dotenv');

//Manjerar las excepciones no detectadas
process.on('uncaughtException', err => {
    console.log(`ERROR: ${err.stack}`);
    console.log('Shutting down server due to uncaught exception');
    process.exit(1)
})

//Configuración del archivo                       //esto te lo comentare porque no me sirve para conectar a mongo atlas que es el web  por lo que comentare esto y si le pongo -- es porque es algo que ya estaba pe 

//--------------------------------------dotenv.config({ path: 'backend/config/config.env' })

//Conectando la base de datos
connectDatabase();



const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`);
});

//Manejar los rechazos de promesas no controladas
process.on("unhandledRejection", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("Shutting down the server due to Unhandled Promise rejections");
  server.close(() => {
    process.exit(1);
  });
});