// routes/seller.js
import express from "express";
import { sellerSignup, modifySellerIds, modifySellerPassword, deleteSeller, getSellerData, changeSellerPassword, getSellerInsights } from "../controllers/sellerController.js";
import upload from "../middlewares/multerMiddleware.js";
import { addProduct } from "../controllers/sellerController.js";
import { sellerAuth } from "../middlewares/sellerMiddleware.js";
import { getSellerProducts, getProductByIdForSeller, updateProduct } from "../controllers/productsController.js";
import { getSellerOrders, updateSellerStatus } from "../controllers/ordersController.js"
import { getSellerMessageHistory, sendSupportMessage } from "../controllers/sellerSupportController.js";

const sellerRouter = express.Router();

// Signup request
sellerRouter.post("/signup-request",upload.fields([
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 }
]), sellerSignup);

// Modify seller IDs
sellerRouter.post("/modifyIds", modifySellerIds);

// Reset seller password
sellerRouter.post("/modifyPassword", modifySellerPassword);
 
// Delete seller
sellerRouter.post("/deleteSeller", deleteSeller);


//Get Products
sellerRouter.get("/products", sellerAuth, getSellerProducts);
sellerRouter.get("/products/:id", sellerAuth, getProductByIdForSeller);

// Add Product
sellerRouter.post("/add-product", sellerAuth, upload.array("images", 6),addProduct);

sellerRouter.put("/update-product/:id", sellerAuth, upload.array("images", 6), updateProduct);


//Get Orders
sellerRouter.get("/my-orders", sellerAuth, getSellerOrders);

sellerRouter.patch("/order-status/:id", sellerAuth, updateSellerStatus);


sellerRouter.patch("/update-password", sellerAuth, changeSellerPassword);

sellerRouter.get("/getmydetails", sellerAuth, getSellerData);
sellerRouter.get("/insights", sellerAuth, getSellerInsights);


sellerRouter.get("/support/history", sellerAuth, getSellerMessageHistory);
sellerRouter.post("/support/send", sellerAuth, sendSupportMessage);

export default sellerRouter;