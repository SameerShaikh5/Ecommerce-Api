import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shippingDetails: {
        roomNo: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
        phone: String
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: String,
            quantity: Number,
            price: Number,
            image: String
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    couponCode:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Coupon"
    },
    paymentMethod: {
        type: String, 
        enum:["COD", "Online"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum:["Pending", "Received"],
        default: "Pending"
    },
    orderStatus: {
        type: String,
        enum:["Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Processing",
    },
    razorpay_order_id:{
        type:String
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: {
        type: Date
    }
});




export const Order = mongoose.model("Order", orderSchema)