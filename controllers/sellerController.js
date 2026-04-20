// controllers/sellerController.js
import SellerSign from "../models/sellerSignUp.js";
import Otp from "../models/Otp.js";
import Seller from "../models/Seller.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../lib/cloudinaryUploader.js";
import Products from "../models/Products.js";
import Orders from "../models/Orders.js";

// ---------------- SELLER SIGNUP ----------------
export const sellerSignup = async (req, res) => {
  const frontPath = req.files?.idFront?.[0]?.path;
  const backPath = req.files?.idBack?.[0]?.path;

  try {
    const { name, email, password, phone, otp } = req.body;

    if (!frontPath || !backPath) {
      return res.status(400).json({ message: "ID front and back are required" });
    }

    // 2. Validate basic logic BEFORE uploading to Cloudinary (saves bandwidth/time)
    const record = await Otp.findOne({ email, otp });
    if (!record) throw new Error("Invalid OTP");

    const existingRequest = await SellerSign.findOne({ email });
    const existingSeller = await Seller.findOne({ email });
    if (existingRequest || existingSeller) throw new Error("Seller already exists or request pending");

    // 3. Upload and DELETE immediately
    const frontUpload = await uploadToCloudinary(frontPath, "seller_ids/front");
    if (frontPath) await fs.promises.unlink(frontPath).catch(err => console.error("Unlink error:", err));

    const backUpload = await uploadToCloudinary(backPath, "seller_ids/back");
    if (backPath) await fs.promises.unlink(backPath).catch(err => console.error("Unlink error:", err));

    if (!frontUpload || !backUpload) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    const seller = await SellerSign.create({
      name, email, password, phone,
      idFrontLink: frontUpload,
      idBackLink: backUpload,
      status: "pending",
    });

    await Otp.deleteMany({ email });

    res.status(200).json({ message: "Registered successfully. Pending approval.", seller });

  } catch (err) {
    // 4. THE SAFETY CATCH: If anything failed above, clean up the files if they still exist
    if (frontPath && fs.existsSync(frontPath)) await fs.promises.unlink(frontPath).catch(() => {});
    if (backPath && fs.existsSync(backPath)) await fs.promises.unlink(backPath).catch(() => {});

    console.error("Seller signup error:", err);
    res.status(500).json({ message: err.message || "Signup failed" });
  }
};

// ---------------- MODIFY SELLER IDS ----------------
export const modifySellerIds = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !req.files?.idFront || !req.files?.idBack) {
      return res
        .status(400)
        .json({ message: "Email and new ID files are required" });
    }

    const seller = await SellerSign.findOne({ email });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Delete old IDs from Cloudinary
    if (seller.idFrontLink) await deleteFromCloudinary(seller.idFrontLink);
    if (seller.idBackLink) await deleteFromCloudinary(seller.idBackLink);

    // Upload new IDs
    const frontUpload = await uploadToCloudinary(
      req.files.idFront[0].path,
      "seller_ids/front",
    );
    const backUpload = await uploadToCloudinary(
      req.files.idBack[0].path,
      "seller_ids/back",
    );

    // Delete local files
    fs.unlink(req.files.idFront[0].path, () => {});
    fs.unlink(req.files.idBack[0].path, () => {});

    seller.idFrontLink = frontUpload?.secure_url || null;
    seller.idBackLink = backUpload?.secure_url || null;
    await seller.save();

    res.status(200).json({ message: "IDs updated successfully", seller });
  } catch (err) {
    console.error("Modify seller IDs error:", err);
    res
      .status(500)
      .json({ message: "Failed to update IDs", error: err.message });
  }
};

// ---------------- MODIFY SELLER PASSWORD ----------------
export const modifySellerPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and new password are required" });

    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.password = password;
    await seller.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Modify seller password error:", err);
    res
      .status(500)
      .json({ message: "Failed to update password", error: err.message });
  }
};

// ---------------- DELETE SELLER ----------------
export const deleteSeller = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const seller = await SellerSign.findOne({ email });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Delete ID files from Cloudinary
    if (seller.idFrontLink) await deleteFromCloudinary(seller.idFrontLink);
    if (seller.idBackLink) await deleteFromCloudinary(seller.idBackLink);

    await SellerSign.deleteOne({ email });

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (err) {
    console.error("Delete seller error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete seller", error: err.message });
  }
};

// ---------------- LOGIN SELLER ----------------
export const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(400).json({ message: "No seller exists" });

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password is incorrect" });

    const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("sellerToken", token, cookieOptions);

    res
      .status(200)
      .json({ message: "Login successful", cookieName: "sellerToken" });
  } catch (err) {
    console.error("Seller login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      detailedDescription,
      price,
      stock,
      category,
      seller,
      variations,
    } = req.body;


    // Correct check for upload.array
    if (!req.files || req.files.length < 2) {
      return res
        .status(400)
        .json({ message: "At least 2 images are required" });
    }
    console.log("zero");

    // Upload images to Cloudinary
    const uploadedImages = [];
    for (const file of req.files) {
      const imgPath = file.path;
      const uploadRes = await uploadToCloudinary(imgPath, "products");
      if (uploadRes) uploadedImages.push(uploadRes);
      try {
        await fs.promises.unlink(file.path);
        console.log(`Deleted temp file: ${file.path}`);
      } catch (err) {
        console.error(`Failed to delete temp file ${file.path}:`, err);
      }
    }

    if (!uploadedImages.length) {
      return res.status(500).json({ message: "Image upload failed" });
    }
    console.log("first");

     const productSeller = await Seller.findOne({ email: seller });

    if (!productSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const product = await Products.create({
      name,
      description,
      detailedDescription,
      price: Number(price),
      stock: Number(stock),
      category,
      seller,
      sellerName : productSeller.name,
      sellerId : productSeller._id,
      images: uploadedImages,
      variations: JSON.parse(variations || "[]"),
      status: "Active",
    });
   
    productSeller.activeListings = productSeller.activeListings + 1;
    productSeller.listings = productSeller.listings + 1;
    await productSeller.save();
    res.status(200).json({ message: "Product added successfully", product });
  } catch (err) {
    console.error("Add product error:", err);
    res
      .status(500)
      .json({ message: "Failed to add product", error: err.message });
  }
};


export const getSellerData = async (req, res) => {
  try {
    const seller = req.seller;

    const { password, ...sellerWithoutPassword } = seller.toObject();

    res.status(200).json({
      success: true,
      seller: sellerWithoutPassword
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const changeSellerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    const seller = req.seller;
    if (!seller) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    seller.password = newPassword;

    await seller.save();


    res.status(200).json({
      message: "Password changed successfully",
      success: true
    });
  } catch (err) {
    console.error("Change seller password error:", err);
    res.status(500).json({
      message: "Failed to change password",
      error: err.message,
      success: false
    });
  }
};

export const getSellerInsights = async (req, res) => {
  try {
    const sellerEmail = req.seller?.email;
    const { range } = req.query;
    const now = new Date();
    let startDate, prevStartDate, groupBy, labelFormatter;

    // --- Dynamic Time Logic ---
    if (range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      groupBy = { $dayOfMonth: "$createdAt" };
      labelFormatter = (val) => `Day ${val}`;
    } else if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      groupBy = { $month: "$createdAt" };
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      labelFormatter = (val) => months[val - 1];
    } else {
      startDate = new Date(0);
      prevStartDate = new Date(0);
      groupBy = { $year: "$createdAt" };
      labelFormatter = (val) => `${val}`;
    }

    // --- 1. Real-time Seller Stats ---
    const seller = await Seller.findOne({ email: sellerEmail });

    // --- 2. Chart Data & Growth Calculation ---
    const [currentPeriod, previousPeriod] = await Promise.all([
      Orders.aggregate([
        { $match: { sellerEmail, createdAt: { $gte: startDate }, sellerStatus: "delivered" } },
        { $group: { _id: groupBy, revenue: { $sum: "$totalAmountUSD" }, sales: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Orders.aggregate([
        { $match: { sellerEmail, createdAt: { $gte: prevStartDate, $lt: startDate }, sellerStatus: "delivered" } },
        { $group: { _id: null, revenue: { $sum: "$totalAmountUSD" }, sales: { $sum: 1 } } }
      ])
    ]);

    const chartData = currentPeriod.map(item => ({
      name: labelFormatter(item._id),
      revenue: item.revenue,
      sales: item.sales,
    }));

    // --- 3. Growth Percentage Logic ---
    const prevRevenue = previousPeriod[0]?.revenue || 0;
    const currentRevenue = currentPeriod.reduce((acc, curr) => acc + curr.revenue, 0);
    const growth = prevRevenue === 0 ? 100 : (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1);

    res.status(200).json({
      chartData,
      totalRevenue: currentRevenue,
      totalSales: currentPeriod.reduce((acc, curr) => acc + curr.sales, 0),
      revenueGrowth: growth,
      averageRating: seller?.rating || 0,
      activeListings: seller?.activeListings || 0,
      totalReviews: seller?.numReviews || 0,
      payoutPending: seller?.remainingPayout || 0
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching insights" });
  }
};