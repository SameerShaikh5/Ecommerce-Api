import redis from "../config/redisConfig.js";
import { TryCatch } from "../middlewares/errorMiddleware.js"
import { Order } from "../models/orderModel.js"
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Coupon } from "../models/couponModel.js";
import instance from "../utils/razorpayInstance.js";

export const getAllUserOrders = TryCatch(async (req, res, next) => {

    const user = await User.findById(req.user.id)

    let orders = await redis.get(`userorders_${user._id}`)

    if (!orders) {
        orders = await Order.find({ userId: user._id })

        await redis.set(`userorders_${user._id}`, JSON.stringify(orders), 'EX', 60)
    } else {
        orders = JSON.parse(orders)
    }



    return res.status(200).json({
        success: true,
        orders: orders
    })
})

export const getUserOrder = TryCatch(async (req, res, next) => {

    const { orderId } = req.params

    if (!orderId) {
        return next(new ErrorHandler("orderId is required!", 400))
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user.id })

    if (!order) {
        return next(new ErrorHandler("Order not found!", 404))
    }


    return res.status(200).json({
        success: true,
        order: order
    })
})

export const cancelOrder = TryCatch(async (req, res, next) => {

    const { orderId } = req.params

    if (!orderId) {
        return next(new ErrorHandler("orderId is required!", 400))
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user.id })

    if (!order) {
        return next(new ErrorHandler("Order not found!", 404))
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("Delivered Order cannot be cancelled!", 400))
    }

    if (order.orderStatus === "Cancelled") {
        return next(new ErrorHandler("Order is already cancelled!", 400));
    }

    order.orderStatus = "Cancelled"

    //Remove cached orders
    await redis.del(`userorders_${req.user.id}`)

    await order.save()

    return res.status(200).json({
        success: true,
        message: "Order Cancelled!",
        cancelledOrder: order
    })

})


export const createCodOrder = TryCatch(async (req, res, next) => {

    let { roomNo, street, city, state, pincode, country, phone, code } = req.body


    if (!roomNo || !street || !city || !state || !pincode || !country || !phone) {
        return next(new ErrorHandler("Shipping Details is required!", 400))
    }

    const user = await User.findById(req.user.id).populate("cart.productId")

    if (user.cart.length == 0) {
        return next(new ErrorHandler("Cart is Empty!!", 400))
    }

    let discount = 0

    const coupon = await Coupon.findOne({ code: code })

    let couponId;

    if (coupon) {
        if (coupon.expiry < new Date()) {
            return next(new ErrorHandler("Coupon has expired!", 400))
        }

        if (coupon.usageLimit === coupon.usedCount) {
            return next(new ErrorHandler("Coupon usage limit reached!", 400))
        }
        discount = coupon.discount
        couponId = coupon._id
    }




    let items = []

    let itemsTotalAmount = 0

    let shipping = parseInt(process.env.SHIPPING_PRICE)

    user.cart.forEach((item) => {

        let cartItem = {
            productId: item.productId,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
            image: item.productId.image
        }

        itemsTotalAmount += item.productId.price * item.quantity

        items.push(cartItem)
    })

    let totalAmount = itemsTotalAmount + shipping - discount

    if (totalAmount < 0) {
        totalAmount = 0
    }

    let createdOrder = await Order.create({
        userId: user._id,
        shippingDetails: {
            roomNo, street, city, state, pincode, country, phone
        },
        items: items,
        totalAmount: totalAmount,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        couponCode: couponId
    })

    if (coupon) {
        coupon.usedCount += 1
        await coupon.save()
    }
    //Empty user's cart
    user.cart = []

    await user.save()

    return res.status(201).json({
        success: true,
        message: "Order Created Successfully.",
        order: createdOrder
    })
})


//Online order

export const createOnlineOrder = TryCatch(async (req, res, next) => {

    let { code } = req.body || {}

    const user = await User.findById(req.user.id).populate("cart.productId")

    if (user.cart.length == 0) {
        return next(new ErrorHandler("Cart is Empty!!", 400))
    }

    let discount = 0

    let coupon = null;

    if (code) {
        coupon = await Coupon.findOne({ code: code });
    }



    if (coupon) {
        if (coupon.expiry < new Date()) {
            return next(new ErrorHandler("Coupon has expired!", 400))
        }

        if (coupon.usageLimit === coupon.usedCount) {
            return next(new ErrorHandler("Coupon usage limit reached!", 400))
        }
        discount = coupon.discount
    }



    let itemsTotalAmount = 0

    let shipping = parseInt(process.env.SHIPPING_PRICE)

    user.cart.forEach((item) => {
        itemsTotalAmount += item.productId.price * item.quantity
    })

    let totalAmount = itemsTotalAmount + shipping - discount


    //If amount is zero create order directly.
    if (totalAmount < 0) {
        totalAmount = 1
    }

    let options = {
        amount: totalAmount * 100,
        currency: "INR",
    }

    let order = await instance.orders.create(options)

    return res.status(201).json({
        success: true,
        order
    })

})


export const verifyPayment = TryCatch(async (req, res, next) => {

    // let { razorpay_payment_id, razorpay_order_id, razorpay_signature, roomNo, street, city, state, pincode, country, phone, code } = req.body

    // const generated_signature = crypto
    //     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    //     .update(razorpay_order_id + "|" + razorpay_payment_id)
    //     .digest("hex");

    // if (generated_signature !== razorpay_signature) {
    //     return next(new ErrorHandler("Payment Verification Failed!", 400));
    // }

    let generated_signature = true
    let razorpay_order_id = null

    let { roomNo, street, city, state, pincode, country, phone, code } = req.body

    const user = await User.findById(req.user.id).populate("cart.productId")

    if (user.cart.length == 0) {
        return next(new ErrorHandler("Cart is Empty!!", 400))
    }

    let discount = 0
    let coupon = null

    if (code) {
        coupon = await Coupon.findOne({ code: code })
    }


    if (coupon) {
        discount = coupon.discount
    }




    let items = []

    let itemsTotalAmount = 0

    let shipping = parseInt(process.env.SHIPPING_PRICE)

    user.cart.forEach((item) => {

        let cartItem = {
            productId: item.productId,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
            image: item.productId.image
        }

        itemsTotalAmount += item.productId.price * item.quantity

        items.push(cartItem)
    })

    let totalAmount = itemsTotalAmount + shipping - discount

    if (totalAmount < 0) {
        totalAmount = 1
    }

    let createdOrder = await Order.create({
        userId: user._id,
        shippingDetails: {
            roomNo, street, city, state, pincode, country, phone
        },
        items: items,
        totalAmount: totalAmount,
        paymentMethod: "Online",
        razorpay_order_id: razorpay_order_id,
        paymentStatus: "Received",
        couponCode: coupon._id || null
    })

    if (coupon) {
        coupon.usedCount += 1
        await coupon.save()
    }
    //Empty user's cart
    user.cart = []

    await user.save()

    return res.status(201).json({
        success: true,
        message: "Order Created Successfully.",
        order: createdOrder
    })

})







//Admin Operations

export const getAllOrders = TryCatch(async (req, res, next) => {

    let orders = await redis.get('all_orders')

    if (!orders) {
        orders = await Order.find({})

        await redis.set("all_orders", JSON.stringify(orders), 'EX', 60)
    } else {
        orders = JSON.parse(orders)
    }


    return res.status(200).json({
        success: true,
        orders: orders
    })

})

export const getOrder = TryCatch(async (req, res, next) => {

    const { orderId } = req.params

    if (!orderId) {
        return next(new ErrorHandler("orderId is required!", 400))
    }

    const order = await Order.findById(orderId)

    if (!order) {
        return next(new ErrorHandler("Order not found!", 404))
    }

    return res.status(200).json({
        success: true,
        order: order
    })

})

export const updateOrderStatus = TryCatch(async (req, res, next) => {

    const { orderId } = req.params

    if (!orderId) {
        return next(new ErrorHandler("orderId is required!", 400))
    }

    const order = await Order.findById(orderId)

    if (!order) {
        return next(new ErrorHandler("Order not found!", 404))
    }

    if (order.orderStatus === "Processing") {
        order.orderStatus = "Shipped"
    } else if (order.orderStatus === "Shipped") {
        order.orderStatus = "Delivered"
        order.deliveryDate = new Date()
    } else if (order.orderStatus == "Delivered") {
        return next(new ErrorHandler("Order already delivered!", 400))
    } else if (order.orderStatus == "Cancelled") {
        return next(new ErrorHandler("Order was cancelled!", 400))
    }

    await order.save()

    return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order,
    });
})


export const adminCancelOrder = TryCatch(async (req, res, next) => {

    const { orderId } = req.params

    if (!orderId) {
        return next(new ErrorHandler("orderId is required!", 400))
    }

    const order = await Order.findOne({ _id: orderId })

    if (!order) {
        return next(new ErrorHandler("Order not found!", 404))
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("Order was already fullfilled!", 400))
    }

    if (order.orderStatus === "Cancelled") {
        return next(new ErrorHandler("Order is already cancelled!", 400));
    }

    order.orderStatus = "Cancelled"

    await order.save()

    return res.status(200).json({
        success: true,
        message: "Order Cancelled by Admin!",
        cancelledOrder: order
    })

})

