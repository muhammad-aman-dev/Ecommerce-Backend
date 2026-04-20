import jwt from "jsonwebtoken"
import User from "../models/Users.js"
import Otp from "../models/Otp.js"
import nodemailer from "nodemailer"
import Admin from "../models/Admin.js"
import Seller from "../models/Seller.js"
import bcrypt from "bcryptjs"
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinaryUploader.js"
import fs from "fs"

// Cookie configuration helper
const getCookieOptions = () => ({
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: "/",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production", // only secure in production
})

// ---------------- SIGNUP ----------------
export const signupWithPassword = async (req, res) => {
  try {
    const { name, email, password } = req.body

    let user = await User.findOne({ email })
    if (user) return res.status(400).json({ message: "User already exists" })

    user = await User.create({ name, email, password, isVerified: true })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.cookie("token", token, getCookieOptions())

    res.json({ message: "Signup successful", user })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ---------------- LOGIN ----------------
export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: "Invalid credentials" })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.cookie("token", token, getCookieOptions())

    res.json({ message: "Login successful", user })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ---------------- SEND OTP ----------------
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await Otp.deleteMany({ email })
    await Otp.create({ email, otp })

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

   // ... inside sendOtp after generating the otp variable
await transporter.sendMail({
  from: `"TradeXon Security" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: `${otp} is your TradeXon verification code`,
  html: `
  <div style="background-color: #f8fafc; padding: 50px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 50px rgba(13, 148, 136, 0.05); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #0f172a; padding: 40px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
          TRADE<span style="color: #14b8a6;">XON</span>
        </h1>
        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Secure Marketplace</p>
      </div>

      <div style="padding: 50px 40px; text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #f0fdfa; border-radius: 20px; margin-bottom: 24px;">
           <img src="https://cdn-icons-png.flaticon.com/512/6195/6195699.png" width="32" height="32" style="margin-top: 16px;" alt="Shield" />
        </div>
        
        <h2 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 900; tracking: -0.5px;">Verify your identity</h2>
        <p style="margin: 16px 0 32px; color: #64748b; font-size: 15px; line-height: 24px; font-weight: 500;">
          To keep your account secure, use the following one-time password (OTP) to complete your request.
        </p>

        <div style="background-color: #f8fafc; border: 2px solid #f1f5f9; border-radius: 24px; padding: 30px; margin-bottom: 32px;">
          <span style="display: block; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Verification Code</span>
          <div style="font-family: monospace; font-size: 42px; font-weight: 900; color: #0d9488; letter-spacing: 12px; margin-left: 12px;">
            ${otp}
          </div>
        </div>

        <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
          This code will expire in <span style="color: #0d9488; font-weight: 700;">10 minutes</span>.
        </p>
      </div>

      <div style="margin: 0 40px 40px; padding: 20px; background-color: #fdf2f2; border-radius: 20px; text-align: left;">
        <p style="margin: 0; color: #b91c1c; font-size: 12px; font-weight: 600; line-height: 18px;">
          <strong>Security Tip:</strong> Never share this code with anyone. TradeXon staff will never ask for your password or OTP.
        </p>
      </div>

      <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          © ${new Date().getFullYear()} TradeXon Inc.
        </p>
        <div style="margin-top: 12px;">
          <a href="#" style="color: #64748b; font-size: 11px; text-decoration: none; font-weight: 600;">Privacy Policy</a>
          <span style="color: #cbd5e1; margin: 0 10px;">•</span>
          <a href="#" style="color: #64748b; font-size: 11px; text-decoration: none; font-weight: 600;">Support Center</a>
        </div>
      </div>
    </div>
  </div>
  `
})

    res.json({ message: "OTP sent successfully" })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to send OTP", error: err.message })
  }
}

// ---------------- VERIFY OTP ----------------
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    const record = await Otp.findOne({ email, otp })

    if (!record) return res.status(400).json({ message: "Invalid OTP" })

    let user = await User.findOne({ email })
    if (!user) user = await User.create({ email, isVerified: true })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.cookie("token", token, getCookieOptions())

    await Otp.deleteMany({ email })
    res.json({ message: "Logged in successfully", user })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "OTP verification failed", error: err.message })
  }
}

// ---------------- VERIFY RESET OTP ----------------
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body
    if (!email || !otp || !password) return res.status(400).json({ message: "All fields are required" })

    const record = await Otp.findOne({ email, otp })
    if (!record) return res.status(400).json({ message: "Invalid OTP" })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: "User not found" })

    user.password = password
    await user.save()
    await Otp.deleteMany({ email })

    res.json({ message: "Password reset successful" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Reset password failed", error: err.message })
  }
}

// ---------------- GET AUTH USER ----------------
export const getAuthUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(401).json({ message: "Invalid token" })
  }
}

// ---------------- GET AUTH SELLER ----------------
export const getAuthSeller = async (req, res) => {
  try {
    const token = req.cookies.sellerToken
    if (!token) return res.status(401).json({ message: "Unauthorized" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const seller = await Seller.findById(decoded.id).select("-password")
    if (!seller) return res.status(404).json({ message: "Seller not found" })

    res.json(seller)
  } catch (err) {
    console.error(err)
    res.status(401).json({ message: "Invalid token" })
  }
}

// ---------------- GET AUTH ADMIN ----------------
export const getAuthAdmin = async (req, res) => {
  try {
    const token = req.cookies.adminToken
    if (!token) return res.status(401).json({ message: "Unauthorized" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await Admin.findById(decoded.id).select("-password")
    if (!admin) return res.status(404).json({ message: "Admin not found" })

    res.json(admin)
  } catch (err) {
    console.error(err)
    res.status(401).json({ message: "Invalid token" })
  }
}

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", getCookieOptions())
    res.json({ message: "Logged out successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Logout failed", error: err.message })
  }
}

// ---------------- CREATE ADMIN ----------------
export const createAdmin = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: "Important fields are missing" })

  await Admin.create({ email, password })
  return res.status(200).json({ message: "Admin Created!!!!" })
}

// ---------------- ADMIN LOGIN ----------------
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: "Important fields are missing" })

    const admin = await Admin.findOne({ email })
    if (!admin) return res.status(400).json({ message: "No Admin exists with this Email..." })

    const comparePass = await bcrypt.compare(password, admin.password)
    if (!comparePass) return res.status(400).json({ message: "Password Not correct..." })

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.cookie("adminToken", token, getCookieOptions()).status(200).json({ message: "Login successful", token })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // 🔹 Upload new image to Cloudinary
    const uploadedUrl = await uploadToCloudinary(req.file.path, "avatars");

    if (!uploadedUrl) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }

    // 🔹 Delete old image from Cloudinary (if exists)
    if (req.user.dp) {
      await deleteFromCloudinary(req.user.dp);
    }

    // 🔹 Delete temp file from server
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 🔹 Update user dp
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { dp: uploadedUrl }, 
      { returnDocument: "after" }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated",
      user,
    });
  } catch (error) {
    console.error("Update Avatar Error:", error);

    // 🔹 Cleanup temp file in case of error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ---------------- CHANGE PASSWORD (REQ.USER ONLY) ----------------
export const changeUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // 🔹 Always fetch fresh user from DB
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({
  success: true,
  message: "Password updated successfully",
});

  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      message: "Failed to change password",
      error: error.message,
    });
  }
};