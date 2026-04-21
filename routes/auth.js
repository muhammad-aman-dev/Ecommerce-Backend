import express from "express"
import passport from "passport"
import { sendOtp, verifyOtp, signupWithPassword, loginWithPassword, verifyResetOtp, getAuthUser, logout, getAuthSeller, getAuthAdmin, updateAvatar, changeUserPassword } from "../controllers/authController.js";
import { loginSeller } from "../controllers/sellerController.js";
import jwt from "jsonwebtoken"
import "dotenv/config"
import { createAdmin, adminLogin } from "../controllers/authController.js";
import { adminAuth } from "../middlewares/adminMiddleware.js";
import { userAuth } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";
import { updateBuyerStatus, getMyOrders, requestRefundByBuyer } from "../controllers/ordersController.js";

const router = express.Router()

// ---------------- OTP ----------------
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)
router.post("/verify-reset-otp", verifyResetOtp)

// ---------------- PASSWORD ----------------
router.post("/signup", signupWithPassword)
router.post("/login", loginWithPassword)
router.post("/logout", logout)

// ---------------- GOOGLE ----------------
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

// ---------------- AUTH USER ----------------
router.get("/user/me", getAuthUser)
router.get("/seller/me", getAuthSeller)
router.get("/admin/me", getAuthAdmin)
router.post("/seller-login", loginSeller)

router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.cookie("token", token, {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, 
  path: "/",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production", 
})
    res.redirect(`${process.env.FRONTEND_URL}`)
  }
)

router.post("/createAdmin", adminAuth, createAdmin)
router.post("/admin-login", adminLogin)
router.put("/update-avatar", userAuth, upload.single("avatar"), updateAvatar);
router.post("/change-user-password", userAuth, changeUserPassword)

router.get("/my-orders", userAuth, getMyOrders);
router.patch("/update-status/:id", userAuth, updateBuyerStatus);
router.patch("/request-refund/:orderId", userAuth, requestRefundByBuyer);


export default router;  