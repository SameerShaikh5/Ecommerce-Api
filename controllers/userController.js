import { TryCatch } from "../middlewares/errorMiddleware.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { Product } from "../models/productModel.js";
import mongoose from "mongoose";




export const registerUser = TryCatch(async (req, res, next) => {

    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return next(new ErrorHandler("User details required!", 400))
    }


    let emailRegex = /^[a-z][a-z0-9._-]*@[a-z0-9._-]+\.[a-z]{2,3}$/gi;

    let passwordRegex = /^[^\s]+$/;

    if (!emailRegex.test(email)) {
        return next(new ErrorHandler("Invalid Email!", 400))
    }

    if (!passwordRegex.test(password)) {
        return next(new ErrorHandler("Invalid Email!", 400))
    }

    let existingEmail = await User.findOne({ email: email })

    if (existingEmail) {
        return next(new ErrorHandler("Email Already Exists!", 400))
    }

    let hashedPassword = await bcrypt.hash(password, 8)

    let user = await User.create({
        name, email, password: hashedPassword
    })

    let token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET)


    res.cookie("token", token)

    return res.status(201).json({
        success: true,
        message: "User registered Successfully."
    })

})

export const loginUser = TryCatch(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorHandler("Login details required!", 400))
    }

    let user = await User.findOne({ email: email })

    if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400))
    }

    let checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword) {
        return next(new ErrorHandler("Incorrect Password!", 400))
    }

    let token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET)

    res.cookie("token", token)

    return res.status(200).json({
        success: true,
        message: "LoggedIn Successfully."
    })
})


export const logoutUser = TryCatch(async (req, res, next) => {

    const token = req.cookies.token


    if (token) {
        res.clearCookie("token")
        return res.status(200).json({
            success: true,
            message: "Logged Out Successfully."
        })
    }
})

export const getAllUsers = TryCatch(async (req, res, next) => {
    let users = await User.find({})

    return res.status(200).json({
        success: true,
        users: users
    })
})


export const userCart = TryCatch(async (req, res, next) => {

    let user = await User.findById(req.user.id).populate("cart.productId")
    let cart = []

    if (user.cart.length == 0) {
        return next(new ErrorHandler("Cart is empty.", 400))
    }

    let subtotal = 0

    user.cart.forEach((item) => {
        let cartProduct = {
            productId:item.productId,
            quantity: item.quantity,
            productTotal: item.quantity * item.productId.price,
        }
        subtotal += cartProduct.productTotal
        cart.push(cartProduct)
    })


    let shipping = parseInt(process.env.SHIPPING_PRICE)

    let total = shipping + subtotal


    return res.status(200).json({
        success: true,
        cart: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
    })
})


export const addToCart = TryCatch(async (req, res, next) => {

    let product = await Product.findById(req.params.id)

    if (!product) {
        return next(new ErrorHandler("Product not found!!", 404))
    }

    let user = await User.findById(req.user.id)

    let quantity = 1;

    let existingProduct = false

    for (let item of user.cart) {
        if (item.productId.toString() === product._id.toString()) {
            item.quantity += quantity;
            existingProduct = true;
            break;
        }
    }

    if (!existingProduct) {
        user.cart.push({
            productId: product._id,
            quantity
        })
    }

    await user.save()

    return res.status(201).json({
        success: true,
        message: "Product added to cart."
    })

})

export const increaseQuantity = TryCatch(async (req, res, next) => {

    const productId = req.params.id;

    if (!productId) {
        return next(new ErrorHandler("Product Id is required!", 400))
    }

    await User.updateOne(
        { "_id": req.user.id },
        { $inc: { "cart.$[element].quantity": 1 } },
        { arrayFilters: [{ "element.productId": productId }] }
    );

    return res.status(200).json({ success: true, message: "Quantity increased" });
});

export const decreaseQuantity = TryCatch(async (req, res, next) => {

    const productId = req.params.id;

    if (!productId) {
        return next(new ErrorHandler("Product Id is required!", 400))
    }

    await User.updateOne(
        { "_id": req.user.id },
        { $inc: { "cart.$[element].quantity": -1 } },
        { arrayFilters: [{ "element.productId": productId, "element.quantity": { $gt: 1 } }] }
    );

    return res.status(200).json({ success: true, message: "Quantity decreased" });
});


export const removeProductFromCart = TryCatch(async (req, res, next) => {
    const id = req.params.id;

    if (!id) {
        return next(new ErrorHandler("Product Id is required!", 400));
    }

    await User.updateOne(
        { _id: req.user.id },
        { $pull: { cart: { productId: new mongoose.Types.ObjectId(id) } } }
    );

    return res.status(200).json({ success: true, message: "Product removed from cart" });
});


