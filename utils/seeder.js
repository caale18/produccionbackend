const Product = require ('../models/product');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

const products = require('../data/products');

//punto de configuración
dotenv.config({ path: 'backend/config/config.env'})

connectDatabase();

const seedProducts = async () => {
    try{

        await Product.deleteMany();
        console.log('Los Productos se eliminan')

        await Product.insertMany(products)
        console.log('Todos los productos se agregan')

        process.exit();

    } catch(error) {
        console.log(error.message);
        process.exit();
    }
}

seedProducts()