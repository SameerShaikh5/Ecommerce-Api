import express from "express"
import { isAdmin, isAuthenticated } from "../middlewares/auth.js"
import { adminCancelOrder, createCodOrder, cancelOrder, getAllOrders, getAllUserOrders, getOrder, getUserOrder, updateOrderStatus, createOnlineOrder, verifyPayment } from "../controllers/orderController.js"

const router = express.Router()

router.get("/", isAuthenticated, getAllUserOrders)

router.post("/checkout", isAuthenticated, createCodOrder)

router.get("/order/:orderId", isAuthenticated, getUserOrder)

router.get("/cancel-order/:orderId", isAuthenticated, cancelOrder)

router.post("/create-online-order", isAuthenticated, createOnlineOrder)

router.post("/verify-payment", isAuthenticated, verifyPayment)

//Admin Operations

router.get("/admin/all-orders", isAuthenticated,isAdmin, getAllOrders)

router.get("/admin/order/:orderId", isAuthenticated, isAdmin, getOrder)

router.get("/admin/update-status/:orderId", isAuthenticated, isAdmin, updateOrderStatus)

router.get("/admin/cancel-order/:orderId", isAuthenticated,isAdmin, adminCancelOrder)


export const orderRoutes = router