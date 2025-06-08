


export const errorMiddleware = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Something went wrong"

    if(err.name=="CastError"){
        return res.status(502).json({
        success:false,
        message:"Invalid Id!"
    })
    }

    return res.status(err.statusCode).json({
        success:false,
        message:err.message
    })
}

export const TryCatch = (handler)=>(req,res,next)=>{
    Promise.resolve(handler(req,res,next)).catch(next)
}
