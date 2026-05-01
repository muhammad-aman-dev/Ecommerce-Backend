// routes/admin.js
import express from "express";
import { adminAuth } from "../middlewares/adminMiddleware.js";
import { addSeller, getAllSellerSigns, addBanner, deleteBannerByLink, addDiscount, getAllSellersForAdmin, toggleSellerStatus, findProductById, updateProductStatus, adminUpdateOrderStatus, adminGetOrderById, getAllAdmins, addAdmin, removeAdmin, isSuperAdmin, changeAdminPassword, processMaturedPayouts, getAllRefundRequests, processRefund, getAllComplaints, updateComplaintStatus } from "../controllers/adminController.js";
import { addCategory, removeCategory } from "../controllers/categoryController.js";
import upload from "../middlewares/multerMiddleware.js";
import { getPendingContacts, updateContactStatus } from "../controllers/helpController.js";
import { markAsFeatured, removeFeatured, getFeaturedForAdmin } from "../controllers/productsController.js";

const adminRouter = express.Router();

// Seller management
adminRouter.post("/addSeller", adminAuth, addSeller);
adminRouter.post("/getSellersRequests", adminAuth, getAllSellerSigns);

// Category management
adminRouter.post("/add-category", adminAuth, addCategory);
adminRouter.post("/remove-category", adminAuth, removeCategory);

// Banner management
adminRouter.post("/add-banner", adminAuth, upload.single("image"), addBanner);
adminRouter.post("/delete-banner", adminAuth, deleteBannerByLink);

// Discount Management
adminRouter.post("/add-discount", adminAuth, addDiscount)
adminRouter.post("/contacts/modify-status", adminAuth, updateContactStatus)
adminRouter.post("/toggle-seller-status", adminAuth, toggleSellerStatus)
adminRouter.post("/featured-products/add", adminAuth, markAsFeatured)
adminRouter.post("/featured-products/remove", adminAuth, removeFeatured)
adminRouter.post("/products/status", adminAuth, updateProductStatus)


adminRouter.get("/get-contacts", adminAuth, getPendingContacts)
adminRouter.get("/get-sellers", adminAuth, getAllSellersForAdmin)
adminRouter.get("/featured-products", adminAuth, getFeaturedForAdmin)
adminRouter.get("/products/find", adminAuth, findProductById);

// Example Admin Routes
adminRouter.get("/orders/:orderId", adminAuth, adminGetOrderById);
adminRouter.put("/orders/update-status/:id", adminAuth, adminUpdateOrderStatus);

adminRouter.get("/get-all-admins", adminAuth, isSuperAdmin, getAllAdmins);
adminRouter.post("/add-admin", adminAuth, isSuperAdmin, addAdmin);
adminRouter.delete("/remove-admin/:id", adminAuth, isSuperAdmin, removeAdmin);

adminRouter.patch("/update-password", adminAuth, changeAdminPassword);
adminRouter.post("/manual-payout-trigger", adminAuth, processMaturedPayouts);

adminRouter.get("/refund-requests", adminAuth, getAllRefundRequests);
adminRouter.get("/seller-support/all", adminAuth, getAllComplaints);


adminRouter.put("/support/update/:id", adminAuth, updateComplaintStatus);
// Admin process a specific request
adminRouter.patch("/process-refund/:id", adminAuth, processRefund);

export default adminRouter;