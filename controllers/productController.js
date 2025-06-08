import mongoose from "mongoose";
import { TryCatch } from "../middlewares/errorMiddleware.js";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import uploadImage from "../utils/uploadImage.js";
import redis from "../config/redisConfig.js"


export const getAllProducts = TryCatch(async (req, res, next) => {

    let products = await redis.get("products")

    if (products) {
        return res.status(200).json({
            success: true,
            products: JSON.parse(products)
        })
    }

    products = await Product.find({})
    await redis.set("products", JSON.stringify(products), 'EX', 3600)

    if (!products) {
        return res.status(404).json({
            success: false,
            message: "No products found."
        })
    }

    return res.status(200).json({
        success: true,
        products
    })
})


export const pagination = TryCatch(async (req, res, next) => {

    let page = req.query.page
    page = parseInt(page)

    if (page == 0) {
        return next(new ErrorHandler("Page must start with 1!", 400))
    }

    page -= 1

    let products = await redis.get("products")

    if (!products) {
        products = await Product.find({})
        await redis.set("products", JSON.stringify(products), 'EX', 3600)
    }else{
        products = JSON.parse(products)
    }


    if (products.length == 0) {
        return []
    }

    let startIndex = page * 10

    let products_to_show = 10

    let endIndex = startIndex + products_to_show

    let paginatedProducts = products.slice(startIndex, endIndex)

    return res.status(200).json({
        success: true,
        products: paginatedProducts
    })
})

export const getProduct = TryCatch(async (req, res, next) => {

    const { id } = req.params

    let product = await redis.get(`product_${id}`)


    if (!product) {
        product = await Product.findById(id)
        if (product) {
            await redis.set(`product_${product._id}`, JSON.stringify(product), 'EX', 60)
        }
    } else {
        product = JSON.parse(product)
    }

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found."
        })
    }


    return res.status(200).json({
        success: true,
        product
    })
})

export const addProduct = TryCatch(async (req, res, next) => {

    const { name, price, description, category } = req.body

    if (!name || !price || !description || !category) {
        return res.status(400).json({
            success: false,
            message: "Product details required."
        })
    }

    const image = req.file

    if (!image) {
        return res.status(400).json({
            success: false,
            message: "Product image required"
        })
    }

    let uploadedImage = await uploadImage(image.buffer)

    const newproduct = await Product.create({
        name, price, description, category, image: uploadedImage
    })

    //Remove cached 
    await redis.del(`products`)


    return res.status(201).json({
        success: true,
        message: "Product added successfully.",
        newproduct: newproduct
    })

})

export const updateProduct = TryCatch(async (req, res, next) => {

    const { name, price, description, category } = req.body
    const id = req.params.id

    let product = await Product.findById(id)

    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found!",
        })
    }

    //Remove from cache
    await redis.del(`product_${id}`)

    const image = req.file

    if (name) product.name = name
    if (price) product.price = price
    if (description) product.description = description
    if (category) product.category = category

    if (image) {
        let uploadedImage = await uploadImage(image.buffer)
        product.image = uploadedImage
    }

    await product.save()

    return res.status(200).json({
        success: true,
        message: "Product updated successfully.",
        product:product
    })
})

export const deleteProduct = TryCatch(async (req, res, next) => {

    const { id } = req.params

    let product = await Product.findById(id)

    if (!product) {
        return next(new ErrorHandler("Product Not Found!", 404))
    }

    //remove from user's cart if they saved it
    await User.updateOne({}, { $pull: { cart: { productId: new mongoose.Types.ObjectId(id) } } })


    //Remove cached product
    await redis.del(`product_${id}`)
    await redis.del('products')


    await product.deleteOne()

    return res.status(200).json({
        success: true,
        message: "Product Deleted Successfully!"
    })
})

export const searchbar = TryCatch(async (req, res, next) => {

    const { productName } = req.body

    const products = await Product.find({ name: { $regex: productName, $options: 'i' } })

    if (!products) {
        return next(new ErrorHandler("No Products Found", 400))
    }

    return res.status(200).json({
        success: true,
        products
    })
})

export const filterProducts = TryCatch(async (req, res, next) => {

    let category = req.query.category
    let price = req.query.price


    if (!price || isNaN(price)) {
        return next(new ErrorHandler("Invalid or missing price", 400));
    }

    if (!category) {
        return next(new ErrorHandler("Category is required", 400));
    }

    price = parseInt(price);


    const products = await Product.find({
        price: { $lte: price },
        category: category
    });

    if(!products){
        return next(new ErrorHandler("Products Not Found!", 404))
    }

    return res.status(200).json({
        success: true,
        products
    });
})

