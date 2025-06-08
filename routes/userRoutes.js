import express from "express"
import { addToCart, decreaseQuantity, getAllUsers, increaseQuantity, loginUser, logoutUser, registerUser, removeProductFromCart, userCart } from "../controllers/userController.js"
import { isAdmin, isAuthenticated } from "../middlewares/auth.js"

const router = express.Router()


router.post("/register", registerUser)

router.post("/login", loginUser)

router.get("/logout", logoutUser)

router.get("/all-users", isAuthenticated,isAdmin,getAllUsers)

router.get("/cart", isAuthenticated, userCart)

router.get("/add-to-cart/:id", isAuthenticated, addToCart)

router.get("/increase-quantity/:id", isAuthenticated, increaseQuantity)

router.get("/decrease-quantity/:id", isAuthenticated, decreaseQuantity)

router.get("/remove-from-cart/:id", isAuthenticated, removeProductFromCart)





export const userRoutes = router