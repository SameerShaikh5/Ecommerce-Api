import express from "express";
import { applyCoupon, createCoupon, updateCoupon } from "../controllers/couponController.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router()

router.post("/create-coupon", isAuthenticated, isAdmin, createCoupon)

router.post("/update-coupon/:id", isAuthenticated, isAdmin, updateCoupon)

router.post("/apply-coupon",isAuthenticated, applyCoupon)


export const couponRoutes = router