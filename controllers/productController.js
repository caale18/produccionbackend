const Product = require('../models/product')

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures')
const cloudinary = require('cloudinary');

// Crear nuevo producto => /app/v1/admin/product/new
exports.newProduct = catchAsyncErrors(async (req, res, next) => {
    let images = [];

    // Verificar si 'images' es un string o un array
    if (typeof req.body.images === 'string') {
        images.push(req.body.images);
    } else if (Array.isArray(req.body.images)) {
        images = req.body.images;
    }

    let imagesLinks = [];

    // Subir imágenes a Cloudinary
    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: 'products',
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url
        });
    }

    // Agregar links de las imágenes y usuario al cuerpo de la solicitud
    req.body.images = imagesLinks;
    req.body.user = req.user.id;

    // Crear producto
    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product
    });
});


//Obtener todos los productos => /api/v1/products?keyword=laptop
exports.getProducts = catchAsyncErrors ( async (req, res, next) => {

    const resPerPage = 4;
    const productsCount = await Product.countDocuments()

    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resPerPage)

    const products = await apiFeatures.query;

    setTimeout(() => {
        res.status(200).json({
            success: true,
            productsCount,
            resPerPage,
            products
        })
    }, 400);
})

// Obtener todos los productos (admin) => /api/v1/admin/products
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find();
    
    // Respuesta exitosa
    res.status(200).json({
        success: true,
        products,
    });
});


//Obtener detalles de un solo producto => /api/v1/product/:id

exports.getSingleProduct = catchAsyncErrors ( async (req, res, next) => {

    const product = await Product.findById(req.params.id)

    if(!product) {
        return next(new ErrorHandler('Producto no encontrado', 404));
    }
    
    res.status(200).json({
        success: true,
        product
    })
})

//Actualizar nuestro producto => /api/v1/admin/product/:id
exports.updateProduct = catchAsyncErrors ( async (req, res, next) => {

    let product = await Product.findById(req.params.id)

    if(!product) {
        return next(new ErrorHandler('Producto no encontrado', 404));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        product
    })
})

//Eliminar el producto => /api/v1/admin/product/:id
exports.deleteProduct = catchAsyncErrors ( async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if(!product) {
        return next(new ErrorHandler('Producto no encontrado', 404));
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Producto es eliminado'
    })
})


// Crea una nueva resena => /api/v1/review
exports.createProductReview = catchAsyncErrors( async(req, res, next) => {

    const { rating, comment, productId } = req.body;
    
    

    const review = {
        user: req.user.id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId);

    
    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )

    if(isReviewed) {
        product.reviews.forEach(review => {
            if(review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        })

    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    })

})


// Obtener reseñas de productos => /api/v1/reviews
exports.getProductReviews = catchAsyncErrors( async(req, res, next) => {
    const product = await Product.findById(req.query.id);

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

// Eliminar reseña de producto => /api/v1/reviews
exports.deleteReviews = catchAsyncErrors( async(req, res, next) => {
    const product = await Product.findById(req.query.productId);

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString())

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

