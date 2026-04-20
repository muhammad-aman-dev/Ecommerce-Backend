import express from "express";
import { getCategories } from "../controllers/categoryController.js";
import { getBanners, getDiscount, getStorefrontData } from "../controllers/generalController.js";
import { getProductById, getHomepageProducts, getProductsByCategory, searchProducts, getFeaturedProductsCursor, getTrendingProductsCursor, getBestSellersCursor, getNewArrivalsCursor, getProductsByCategoryCursor } from "../controllers/productsController.js";
import { addContact } from "../controllers/helpController.js";

const generalRouter = express.Router();

generalRouter.get("/get-categories", getCategories)
generalRouter.get("/get-banners", getBanners)
generalRouter.get("/get-product/:id", getProductById)
generalRouter.get("/homepagedata", getHomepageProducts)
generalRouter.get("/get-discount", getDiscount)
generalRouter.get("/getproductsbycategories", getProductsByCategory)
generalRouter.post("/add-contact", addContact)
generalRouter.get("/search-product", searchProducts)
generalRouter.get("/products/featured", getFeaturedProductsCursor)
generalRouter.get("/products/trending", getTrendingProductsCursor)
generalRouter.get("/products/best-sellers", getBestSellersCursor)
generalRouter.get("/products/new-arrivals", getNewArrivalsCursor)
generalRouter.post("/products/category-products", getProductsByCategoryCursor)
generalRouter.get("/seller/:id", getStorefrontData);


export default generalRouter;