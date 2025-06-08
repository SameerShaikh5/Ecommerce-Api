import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
    },
    cart:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        },
        quantity:{
            type:Number,
            default:1
        }
    }],
    isAdmin:{
        type:Boolean,
        default:false
    }
},{ timestamps: true })

export const User = mongoose.model("User", userSchema)