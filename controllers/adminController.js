// controllers/sellerAdminController.js
import SellerSign from "../models/sellerSignUp.js";
import Seller from "../models/Seller.js";
import Banner from "../models/Banner.js";
import Discounts from "../models/Discounts.js";
import Products from "../models/Products.js";
import Order from "../models/Orders.js";
import Admin from "../models/Admin.js";
import nodemailer from "nodemailer";
import fs from "fs";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../lib/cloudinaryUploader.js";

// ---------------- FILE VALIDATION ----------------
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const validateFile = (file) => {
  if (!file) throw new Error("File missing");
  if (file.size > MAX_FILE_SIZE) throw new Error("File too large (max 10MB)");
  if (!ALLOWED_TYPES.includes(file.mimetype))
    throw new Error("Invalid file type");
};

// ---------------- EMAIL SETUP ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendSellerEmail = async (email, name, password, goal) => {
  const subject =
    goal === "accept"
      ? "Your Seller Account Has Been Approved ✅"
      : "Update regarding your Seller Request ❌";

  const htmlContent = `
<div style="background-color: #f8fafc; padding: 50px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 50px rgba(13, 148, 136, 0.05); border: 1px solid #f1f5f9;">
    
    <div style="background-color: #0f172a; padding: 40px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
        TRADE<span style="color: #14b8a6;">XON</span>
      </h1>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Partner Portal</p>
    </div>

    <div style="padding: 50px 40px;">
      <h2 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 900; tracking: -0.5px;">
        ${goal === "accept" ? "🎉 Welcome to the Team!" : "Account Application Status"}
      </h2>

      <p style="margin: 20px 0; color: #64748b; font-size: 15px; line-height: 24px;">
        Dear <strong>${name}</strong>,
      </p>

      ${
        goal === "accept"
          ? `
          <p style="color: #64748b; font-size: 15px; line-height: 24px;">
            We are thrilled to inform you that your seller account request has been <span style="color: #0d9488; font-weight: 700;">Approved</span>. You can now access your dashboard and start listing your premium products.
          </p>

          <div style="background-color: #f8fafc; border: 2px solid #f1f5f9; border-radius: 24px; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 10px; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Your Temporary Login Details</p>
            <p style="margin: 5px 0; color: #1e293b; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0; color: #1e293b; font-size: 14px;"><strong>Password:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
          </div>

          <div style="text-align: center; margin-top: 35px;">
            <a href="${process.env.FRONTEND_URL}/seller/login"
              style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 18px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 20px rgba(13, 148, 136, 0.15);">
              Access Seller Dashboard
            </a>
          </div>
          `
          : `
          <p style="color: #64748b; font-size: 15px; line-height: 24px;">
            Thank you for your interest in joining <strong>TradeXon</strong>. After reviewing your application, we regret to inform you that we cannot approve your seller request at this time.
          </p>

          <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-radius: 20px;">
             <p style="margin: 0; color: #b91c1c; font-size: 13px; font-weight: 600; line-height: 20px;">
               Reason: This is often due to incomplete documentation or low-resolution ID uploads. You are welcome to submit a fresh application with updated details.
             </p>
          </div>
          `
      }

      <p style="margin-top: 40px; color: #1e293b; font-size: 15px;">
        Best Regards,<br/>
        <strong style="color: #0d9488;">TradeXon Admin Team</strong>
      </p>
    </div>

    <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
        © ${new Date().getFullYear()} TradeXon Inc.
      </p>
      <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 10px; font-weight: 500;">
        Building the future of conscious commerce.
      </p>
    </div>
  </div>
</div>
`;

  await transporter.sendMail({
    from: `"TradeXon Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  });
};

const sendStatusUpdateEmail = async (email, name, status) => {
  const isSuspended = status === "Suspended";
  const subject = isSuspended 
    ? "Security Alert: Your Merchant Account has been Suspended ⚠️" 
    : "Good News: Your Merchant Account is Active again! ✅";

  const htmlContent = `
<div style="background-color: #f8fafc; padding: 50px 20px; font-family: 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
    
    <div style="background-color: ${isSuspended ? '#be123c' : '#0f172a'}; padding: 40px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
        TRADE<span style="color: ${isSuspended ? '#fda4af' : '#14b8a6'};">XON</span>
      </h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Status Management</p>
    </div>

    <div style="padding: 50px 40px;">
      <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 900;">Hello ${name},</h2>
      
      <p style="margin: 20px 0; color: #64748b; font-size: 15px; line-height: 26px;">
        This is an automated notification regarding your merchant partnership with TradeXon. Your account status has been updated to: 
        <strong style="color: ${isSuspended ? '#be123c' : '#0d9488'}; text-transform: uppercase;">${status}</strong>.
      </p>

      ${isSuspended ? `
      <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 25px; margin: 30px 0; border-radius: 0 24px 24px 0;">
        <p style="margin: 0 0 10px; color: #9f1239; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
          Account Restrictions Applied:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #be123c; font-size: 14px; line-height: 22px; font-weight: 500;">
          <li>Access to <strong>Add Products</strong> and <strong>Edit Products</strong> modules has been locked.</li>
          <li><strong>Payouts:</strong> All pending and future payouts are frozen until the suspension is lifted.</li>
          <li>Existing listings are still active for fulfillment only.</li>
        </ul>
        <p style="margin-top: 15px; color: #9f1239; font-size: 13px; font-style: italic; font-weight: 600;">
          Note: You are still responsible for processing and shipping any pending orders.
        </p>
      </div>
      ` : `
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 30px 0; border-radius: 0 16px 16px 0;">
        <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600; line-height: 22px;">
          Your access has been fully restored. You can now log in to your dashboard, manage products, and request payouts immediately.
        </p>
      </div>
      `}

      <p style="margin: 25px 0; color: #64748b; font-size: 14px;">
        If you have any questions or believe this was done in error, please contact our support team at 
        <a href="mailto:support@tradexon.com" style="color: #0d9488; font-weight: 700; text-decoration: none;">support@tradexon.com</a>.
      </p>

      <p style="margin-top: 40px; color: #1e293b; font-size: 15px;">
        Best Regards,<br/>
        <strong style="color: #0d9488;">TradeXon Compliance Team</strong>
      </p>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
       <p style="margin: 0; color: #cbd5e1; font-size: 10px;">© ${new Date().getFullYear()} TradeXon Inc. All rights reserved.</p>
    </div>
  </div>
</div>
`;

  await transporter.sendMail({
    from: `"TradeXon Compliance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  });
};

const sendProductSuspensionEmail = async (email, productName, reason) => {
  const htmlContent = `
    <div style="background-color: #f8fafc; padding: 40px; font-family: 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <div style="background-color: #be123c; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Product Suspended</h1>
        </div>
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #1e293b;">Hello,</p>
          <p style="font-size: 15px; color: #64748b; line-height: 24px;">
            Your product <strong style="color: #0f172a;">"${productName}"</strong> has been suspended and hidden from the Tradexon marketplace.
          </p>
          <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-weight: 800; color: #9f1239; font-size: 11px; text-transform: uppercase;">Reason for Action:</p>
            <p style="margin: 0; color: #be123c; font-size: 14px; line-height: 20px;">${reason}</p>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">If you have updated the product to meet our guidelines, please contact support.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #94a3b8;">© ${new Date().getFullYear()} TradeXon Inc. • Compliance Team</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"TradeXon Compliance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `⚠️ Action Required: Product Suspended - ${productName}`,
    html: htmlContent,
  });
};

const sendAdminCredentialEmail = async (email, password, goal) => {
  const isAdminCreated = goal === "created";
  const subject = isAdminCreated 
    ? "Welcome to the TradeXon Executive Team 🛡️" 
    : "Notification: Administrative Access Revoked ⚠️";

  const htmlContent = `
<div style="background-color: #f0f9f9; padding: 50px 20px; font-family: 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #ccfbf1; box-shadow: 0 20px 40px rgba(13, 148, 136, 0.05);">
    
    <div style="background-color: #0f172a; padding: 40px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
        TRADE<span style="color: #14b8a6;">XON</span>
      </h1>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Internal Management System</p>
    </div>

    <div style="padding: 50px 40px;">
      <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 900;">
        ${isAdminCreated ? "Administrative Authorization" : "Access Revocation Notice"}
      </h2>

      <p style="margin: 20px 0; color: #64748b; font-size: 15px; line-height: 26px;">
        ${isAdminCreated 
          ? "You have been authorized as a platform administrator for TradeXon. You now have access to the administrative dashboard to manage sellers, orders, and system configurations." 
          : "Your administrative access to the TradeXon management portal has been formally revoked by a Super Admin."}
      </p>

      ${isAdminCreated ? `
      <div style="background-color: #f8fafc; border: 2px solid #f1f5f9; border-radius: 24px; padding: 25px; margin: 30px 0;">
        <p style="margin: 0 0 10px; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Internal Login Credentials</p>
        <p style="margin: 5px 0; color: #1e293b; font-size: 14px;"><strong>Portal Email:</strong> ${email}</p>
        <p style="margin: 5px 0; color: #1e293b; font-size: 14px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
      </div>
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/admin/login" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 18px; font-weight: 700; font-size: 14px;">Log In to Admin Terminal</a>
      </div>
      ` : `
      <div style="margin: 30px 0; padding: 20px; background-color: #fff1f2; border-radius: 20px; border-left: 4px solid #be123c;">
        <p style="margin: 0; color: #be123c; font-size: 14px; font-weight: 600;">
          All active sessions associated with <strong>${email}</strong> have been terminated. If you believe this was an error, please contact the Chief Operations Officer.
        </p>
      </div>
      `}

      <p style="margin-top: 40px; color: #1e293b; font-size: 15px;">
        Regards,<br/>
        <strong style="color: #0d9488;">TradeXon Operations Bureau</strong>
      </p>
    </div>
  </div>
</div>
`;

  await transporter.sendMail({
    from: `"TradeXon Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  });
};

// ---------------- ACCEPT / REJECT SELLER ----------------
export const addSeller = async (req, res) => {
  try {
    const { sellerSignEmail, goal } = req.body;
    const pendingSeller = await SellerSign.findOne({ email: sellerSignEmail });

    if (!pendingSeller)
      return res
        .status(404)
        .json({ message: "Seller sign request not found." });

    if (goal === "accept") {
      const sellerData = {
        name: pendingSeller.name,
        email: pendingSeller.email,
        password: pendingSeller.password,
        phone: pendingSeller.phone,
        idFrontLink: pendingSeller.idFrontLink,
        idBackLink: pendingSeller.idBackLink,
      };

      const newSeller = new Seller(sellerData);
      await newSeller.save();
      await SellerSign.deleteOne({ email: sellerSignEmail });

      await sendSellerEmail(
        pendingSeller.email,
        pendingSeller.name,
        pendingSeller.password,
        "accept",
      );

      return res
        .status(200)
        .json({ message: "Seller accepted.", seller: newSeller });
    }

    if (goal === "reject") {
      if (pendingSeller.idFrontLink)
        await deleteFromCloudinary(pendingSeller.idFrontLink);
      if (pendingSeller.idBackLink)
        await deleteFromCloudinary(pendingSeller.idBackLink);

      await SellerSign.deleteOne({ email: sellerSignEmail });
      await sendSellerEmail(
        pendingSeller.email,
        pendingSeller.name,
        "",
        "reject",
      );

      return res.status(200).json({ message: "Seller rejected and deleted." });
    }

    return res.status(400).json({ message: "Invalid goal." });
  } catch (error) {
    console.error("Error in addSeller:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ---------------- GET SELLER REQUESTS ----------------
export const getAllSellerSigns = async (req, res) => {
  try {
    const sellerSigns = await SellerSign.find(
      {},
      "name email phone idFrontLink idBackLink",
    );
    const response = sellerSigns.map((doc, index) => ({
      id: index + 1,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      cnicFront: doc.idFrontLink,
      cnicBack: doc.idBackLink,
    }));
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching seller signs:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ---------------- ADD BANNER ----------------
export const addBanner = async (req, res) => {
  try {
    const { title, ref } = req.body;

    if (!title || !ref || !req.file) {
      return res
        .status(400)
        .json({ message: "Title, ref, and image required" });
    }

    validateFile(req.file);

    const imageUrl = await uploadToCloudinary(req.file.path, "banners");

    // delete temp file
    try {
      await fs.promises.unlink(req.file.path);
      console.log(`Deleted temp banner file: ${req.file.path}`);
    } catch (err) {
      console.error(`Failed to delete banner temp file: ${err.message}`);
    }

    if (!imageUrl) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    const banner = new Banner({
      title,
      ref,
      imageLink: imageUrl,
    });

    await banner.save();

    res.status(200).json(banner);
  } catch (err) {
    console.error("Add banner error:", err);
    res
      .status(500)
      .json({ message: "Failed to add banner", error: err.message });
  }
};

// ---------------- DELETE BANNER ----------------
export const deleteBannerByLink = async (req, res) => {
  try {
    const { imageLink } = req.body;
    if (!imageLink)
      return res.status(400).json({ message: "Image link required" });

    const banner = await Banner.findOne({ imageLink });
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    await deleteFromCloudinary(imageLink);
    await Banner.deleteOne({ imageLink });

    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (err) {
    console.error("Delete banner error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete banner", error: err.message });
  }
};


// ---------------- ADD DISCOUNT ----------------
export const addDiscount = async (req, res) => {
  try {
    const { percentage } = req.body;

    if (!percentage) {
      return res.status(400).json({ message: "Discount percentage is required" });
    }

    if (percentage <= 0 || percentage > 90) {
      return res.status(400).json({ message: "Percentage must be between 1 and 90" });
    }

    const adminEmail = req.admin.email;

    const newDiscount = new Discounts({
      percentage,
      adminEmail
    });

    await newDiscount.save();

    res.status(200).json({
      message: "Discount added successfully",
      discount: newDiscount
    });

  } catch (error) {
    console.error("Add discount error:", error);
    res.status(500).json({ message: "Failed to add discount" });
  }
};

export const getAllSellersForAdmin = async (req, res) => {
  try {
    // Fetch sellers
    const sellers = await Seller.find().sort({ createdAt: -1 });

    // Format response
    const formattedSellers = sellers.map((seller) => ({
      id: seller._id, // mongoose id
      name: seller.name,
      email: seller.email,
      listings: seller.listings, // total listings
      activeListings: seller.activeListings, // total listings
      status: seller.status,
      joinedDate: seller.createdAt.toISOString().split("T")[0], // YYYY-MM-DD
      sales: seller.revenue,
      remainingPayout : seller.remainingPayout
    }));

    res.status(200).json({
      success: true,
      count: formattedSellers.length,
      sellers: formattedSellers
    });

  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers"
    });
  }
};


export const toggleSellerStatus = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }

    // Find seller by ID
    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // Toggle status
    const newStatus = seller.status === "Active" ? "Suspended" : "Active";
    seller.status = newStatus;

    await seller.save();

    try {
      await sendStatusUpdateEmail(seller.email, seller.name, newStatus);
    } catch (mailError) {
      console.error("Mail Delivery Failed:", mailError);
    }

    res.status(200).json({
      success: true,
      message: `Seller status updated to ${newStatus}`,
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        status: seller.status
      }
    });
  } catch (error) {
    console.error("Error toggling seller status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const findProductById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: "Search ID is required" });
    }

    const product = await Products.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, 
        { productId: id.toUpperCase() } 
      ]
    }).populate("seller", "shopName email"); 

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.query; 
    const { status, reason } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Products.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    ).populate("seller", "email name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
 
    if (status === "Suspended By Admin") {
      try {
        await sendProductSuspensionEmail(
          product.seller,
          product.name,
          reason || "Violation of marketplace guidelines."
        );
      } catch (mailError) {
        console.error("Mail failed to send for suspension:", mailError);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Product is now ${status}`, 
      product 
    });
  } catch (error) {
    console.error("Update Product Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ---------------- ADMIN: GET ORDER BY CUSTOM ID ----------------
export const adminGetOrderById = async (req, res) => {
  try {
    const { orderId } = req.params; 

    const order = await Order.findOne({ orderId: orderId }).lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "No order found with that ID." 
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ---------------- ADMIN: OVERRIDE STATUS ----------------
export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { sellerStatus, buyerStatus, rating } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousBuyerStatus = order.buyerStatus;
    const seller = await Seller.findOne({ email: order.sellerEmail });

    // 1. Logic for REVERSING status (Cancellation/Refund)
    // We only reverse the seller's balance if the money was actually paid to them
    if (previousBuyerStatus === "received" && (buyerStatus === "cancelled" || buyerStatus === "pending")) {
      if (seller && order.isPaidToSeller) { 
        seller.revenue = seller.revenue - order.totalAmountUSD;
        seller.remainingPayout = seller.remainingPayout - order.totalAmountUSD;
        seller.sales = seller.sales - 1;
        await seller.save();
      }
      
      // Reset financial flags because the "Received" state is being undone
      order.isPaidToSeller = false;
      order.buyerStatusUpdateDate = null;
      order.payoutEligibleDate = null; 
    }

    // 2. Standard Seller Status Updates
    if (sellerStatus) {
      order.sellerStatus = sellerStatus;
      if (sellerStatus === "shipped" && !order.dispatchedAt) {
        order.dispatchedAt = new Date();
      }
      
      // Synchronize individual items
      order.items = order.items.map(item => ({
        ...item,
        sellerStatus: sellerStatus
      }));
    }

    // 3. Standard Buyer Status Updates (Includes Admin Override)
    if (buyerStatus) {
      order.buyerStatus = buyerStatus;
      
      if (buyerStatus === "received") {
        // If Admin is manually marking this as received, we finalize the transaction
        if (seller && !order.isPaidToSeller) {
          seller.revenue = seller.revenue + order.totalAmountUSD;
          seller.remainingPayout = seller.remainingPayout + order.totalAmountUSD;
          seller.sales = seller.sales + 1;
          await seller.save();

          // ✅ This is the GUARD: marking true prevents further refund attempts
          order.isPaidToSeller = true; 
          order.buyerStatusUpdateDate = new Date();
          // Set eligibility to now since Admin verified it
          order.payoutEligibleDate = new Date(); 
        }
      }
    }

    // Keep your existing rating logic if provided in the admin body
    if (rating !== undefined && seller) {
      seller.numReviews = seller.numReviews || 0;
      seller.rating = seller.rating || 0;
      seller.rating = (seller.rating * seller.numReviews + rating) / (seller.numReviews + 1);
      seller.numReviews += 1;
      await seller.save();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated and accounts synchronized",
      order
    });
  } catch (error) {
    console.error("Admin Update Error:", error);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};


export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error fetching administrators", error: error.message });
  }
};

export const addAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: "An administrator with this email already exists." 
      });
    }
    const newAdmin = new Admin({
      email,
      password, 
      role: "admin"
    });

    await newAdmin.save();

    try {
      await sendAdminCredentialEmail(email, password, "created");
    } catch (mailError) {
      console.error("Credential Email Failed:", mailError);
    }

    res.status(201).json({ 
      success: true, 
      message: "Administrator created and credentials sent via email." 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to create administrator", 
      error: error.message 
    });
  }
};


export const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Administrator not found." });
    }

    if (admin.role === "super admin") {
      return res.status(403).json({ message: "Cannot remove a Super Admin account." });
    }

    const adminEmail = admin.email;
    await Admin.findByIdAndDelete(id);

    try {
      await sendAdminCredentialEmail(adminEmail, "", "removed");
    } catch (mailError) {
      console.error("Revocation Email Failed:", mailError);
    }

    res.status(200).json({ 
      success: true, 
      message: "Administrator removed and access revoked." 
    });
  } catch (error) {
    res.status(500).json({ message: "Error during removal process", error: error.message });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === "super admin") {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied: This action requires Super Admin privileges." 
    });
  }
};


export const changeAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    admin.password = newPassword;

    await admin.save();


    res.status(200).json({
      message: "Password changed successfully",
      success: true
    });
  } catch (err) {
    console.error("Change admin password error:", err);
    res.status(500).json({
      message: "Failed to change password",
      error: err.message,
      success: false
    });
  }
};

export const processMaturedPayouts = async (req, res) => {
  console.log("Checking for matured payouts...");
  
  try {
    const now = new Date();

    // 1. Find all eligible orders
    const maturedOrders = await Order.find({
      buyerStatus: "received",
      isPaidToSeller: false,
      payoutEligibleDate: { $lte: now },
      refundStatus: { $ne: "approved" }
    });

    if (maturedOrders.length === 0) {
      return res.status(200).json({ 
        message: "No matured orders found to process." 
      });
    }

    const processedOrderIds = [];

    // 2. Loop through and update sellers atomically
    // Using for...of is fine for ~1,000 records
    for (const order of maturedOrders) {
      try {
        const result = await Seller.updateOne(
          { email: order.sellerEmail },
          { 
            $inc: { 
              revenue: order.totalAmountUSD, 
              remainingPayout: order.totalAmountUSD, 
              sales: 1 
            } 
          }
        );

        // Only add to the 'paid' list if the seller update was successful
        if (result.modifiedCount > 0) {
          processedOrderIds.push(order._id);
        }
      } catch (err) {
        console.error(`Failed to update seller for order ${order._id}:`, err);
        // Continue to next order even if one fails
      }
    }

    // 3. Finalize all orders in ONE database call
    if (processedOrderIds.length > 0) {
      await Order.updateMany(
        { _id: { $in: processedOrderIds } },
        { $set: { isPaidToSeller: true } }
      );
    }

    return res.status(200).json({ 
      message: `Success! ${processedOrderIds.length} matured orders were processed and funds released.`,
      found: maturedOrders.length,
      processed: processedOrderIds.length
    });

  } catch (error) {
    console.error("Payout Route Error:", error);
    return res.status(500).json({ 
      message: "An error occurred while processing payouts.",
      error: error.message 
    });
  }
};