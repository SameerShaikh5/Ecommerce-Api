import express, { urlencoded } from "express"
import { errorMiddleware } from "./middlewares/errorMiddleware.js"
import { connectDb } from "./config/connectDb.js"
import { productRoutes } from "./routes/productRoutes.js"
import { userRoutes } from "./routes/userRoutes.js"
import cookieParser from "cookie-parser"
import { couponRoutes } from "./routes/couponRoutes.js"
import { orderRoutes } from "./routes/orderRoutes.js"

const app = express()
const PORT = process.env.PORT || 3000

//Connect Mongodb
connectDb()


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.get("/", (req,res)=>{
    res.send("Hello")
})

app.use("/products", productRoutes)

app.use("/users", userRoutes)

app.use("/coupons", couponRoutes)

app.use("/orders", orderRoutes)


app.use(errorMiddleware)

app.listen(PORT, ()=>{
    console.log("Server Started...")
})