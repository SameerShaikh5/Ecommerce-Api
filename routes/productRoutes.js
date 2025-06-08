import express from "express"
import { addProduct, deleteProduct, filterProducts, getAllProducts, getProduct, pagination, searchbar, updateProduct } from "../controllers/productController.js"
import upload from "../utils/multer.js"
import { isAdmin, isAuthenticated } from "../middlewares/auth.js"

const router = express.Router()


router.get("/get-all-products", getAllProducts)

router.get("/filter-products", filterProducts)

router.get("/:id", getProduct)

router.post("/add-product",isAuthenticated,isAdmin, upload.single('image'), addProduct)

router.post("/update-product/:id",isAuthenticated,isAdmin, upload.single("image"), updateProduct)

router.get("/delete-product/:id",isAuthenticated,isAdmin, deleteProduct)

router.get("/", pagination)

router.post("/search", searchbar)


export const productRoutes = router