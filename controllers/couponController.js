import { TryCatch } from "../middlewares/errorMiddleware.js";
import { Coupon } from "../models/couponModel.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";


export const createCoupon = TryCatch(async (req,res,next)=>{

    let {code, discount, expiry, usageLimit} = req.body

    if(!code || !discount || !expiry || !usageLimit){
        return next(new ErrorHandler("Coupon code details are required!", 400))
    }

    let expirydate = new Date(expiry)



    let coupon = await Coupon.create({
        code,discount, expiry:expirydate, usageLimit
    })

    return res.status(201).json({
        success:true,
        message:"Coupon created successfully!",
        coupon:coupon
    })

})

export const updateCoupon = TryCatch(async (req,res,next)=>{

    const {id} = req.params

    let coupon = await Coupon.findById(id)

    if(!coupon){
        return next(new ErrorHandler("Coupon not found!", 404))
    }

    let {code, discount, expiry, usageLimit} = req.body
    
    if(code) coupon.code = code
    if(discount) coupon.discount = discount
    if(expiry) coupon.expiry = new Date(expiry)
    if(usageLimit) coupon.usageLimit = usageLimit

    await coupon.save()

    return res.status(201).json({
        success:true,
        message:"Coupon updated successfully!",
        coupon:coupon
    })

})

export const applyCoupon = TryCatch(async (req,res,next)=>{

    let {code} = req.body

    const user = await User.findById(req.user.id)

    if(!code){
        return next(new ErrorHandler("code and totalAmount is required!", 400))
    }


    if(user.cart.length === 0){
        return next(new ErrorHandler("Cart is Empty!", 400))
    }

    let coupon = await Coupon.findOne({code:code})

    if(!coupon){
        return next(new ErrorHandler("Coupon not found", 404))
    }

    if(coupon.usageLimit === coupon.usedCount ){
        return next(new ErrorHandler("Coupon limit reached!", 400))
    }
    
    if (coupon.expiry < new Date()) {
        return next(new ErrorHandler("Coupon has expired!", 400));
    }
    
    let subtotal = 0
    
    user.cart.forEach((item) => {
        productTotal =  item.quantity * item.productId.price,
        subtotal += productTotal
    })
    
    let shipping = parseInt(process.env.SHIPPING_PRICE)

    let total = shipping + subtotal
    


    let discountedAmount = total - coupon.discount

    if (discountedAmount < 0 ){
        discountedAmount = 0
    }


    return res.status(201).json({
        success:true,
        message:"Coupon applied successfully!",
        couponId:coupon._id,
        discount:coupon.discount,
        discountedAmount:discountedAmount
    })
})
