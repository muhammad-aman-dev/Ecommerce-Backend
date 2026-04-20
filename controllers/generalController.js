// controllers/bannerController.js
import Banner from "../models/Banner.js";
import Discounts from "../models/Discounts.js";
import Seller from "../models/Seller.js"
import Products from "../models/Products.js"

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).lean();

    // always return array
    return res.status(200).json(banners || []);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- GET LATEST DISCOUNT ----------------
export const getDiscount = async (req, res) => {
  try {
    const latestDiscount = await Discounts
      .findOne({})
      .sort({ createdAt: -1 }) // latest first
      .lean();

    if (!latestDiscount) {
      return res.status(200).json({
        percentage: 0,
        adminEmail: "tradeXon@gmail.com"
      });
    } 

    return res.status(200).json({
      percentage: latestDiscount.percentage,
      adminEmail: latestDiscount.adminEmail
    });

  } catch (error) {
    console.error("Error fetching discount:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const getStorefrontData = async (req, res) => {
  try {
    const { id } = req.params;

    // Gate 1: Only Active Sellers
    const seller = await Seller.findOne({ 
      _id: id, 
      status: "Active", 
      role: "seller" 
    }).select("name email createdAt rating numReviews sales activeListings");

    if (!seller) {
      return res.status(404).json({ success: false, message: "Store is currently unavailable." });
    }

    // Gate 2: Only Active Products from that Seller
    const products = await Products.find({ 
      seller: seller.email, 
      status: "Active" 
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      seller,
      products
    });
  } catch (error) {
    console.error("Storefront Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};