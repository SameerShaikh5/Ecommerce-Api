import jwt from "jsonwebtoken"
import ErrorHandler from "../utils/errorHandler.js"
import { TryCatch } from "./errorMiddleware.js"
import { User } from "../models/userModel.js"

export const isAuthenticated = TryCatch(async(req,res,next)=>{

    let token = req.cookies.token

    if(!token){
        return next(new ErrorHandler("You need to login first!", 400))
    }

    let decoded = jwt.verify(token, process.env.JWT_SECRET)

    if(!decoded){
        return next(new ErrorHandler("Some error occurred!", 400))
    }

    req.user = decoded

    next()

})


export const isAdmin = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (user && user.isAdmin === true) {
        return next();
    }

    return next(new ErrorHandler("Unauthorized!!", 401));
});