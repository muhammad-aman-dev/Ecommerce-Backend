import Product from "../models/Products.js";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Seller from "../models/Seller.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/cloudinaryUploader.js";
import fs from "fs"; // To clean up temp files from your server

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product || product.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.json({
      success: true,
      product 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    const { category, featured } = req.query;

    let filter = { status: "Active" };

    if (category) filter.category = category;
    if (featured) filter.featured = featured === "true";

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, products });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};


export const markAsFeatured = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findOneAndUpdate(
      { productId },
      { featured: true },
      { returnDocument: 'after' }
    );

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product marked as featured", product });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to mark product as featured" });
  }
};

export const removeFeatured = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: productId },
      { featured: false },
      { returnDocument: 'after' }
    );

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product removed from featured", product });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to remove featured" });
  }
};

export const getFeaturedForAdmin = async (req, res) => {
  try {
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products 
    });
  } catch (err) {
    console.error("Error fetching featured products:", err);
    res.status(500).json({
      success: true,
      message: "Failed to fetch featured products",
      products: [] 
    });
  }
};

export const incrementViews = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOneAndUpdate(
      { productId },
      { $inc: { views: 1 } }, // increment views by 1
      { new: true }
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to increment views" });
  }
};

export const getHomepageProducts = async (req, res) => {
  try {
    const aggregated = await Product.aggregate([
  { $match: { status: "Active" } },
  {
    $addFields: {
      score_featured: {
        $add: [
          { $cond: [{ $eq: ["$featured", true] }, 20, 0] },
          { $multiply: ["$salesCount", 0.5] },
          { $multiply: ["$views", 0.3] },
          { $multiply: [{ $rand: {} }, 20] }
        ]
      },
      score_trending: { $add: [ { $multiply: ["$views", 1] }, { $multiply: ["$salesCount", 0.3] }, { $multiply: [{ $rand: {} }, 20] } ] },
      score_bestseller: { $add: [ { $multiply: ["$salesCount", 1] }, { $multiply: ["$views", 0.3] }, { $multiply: [{ $rand: {} }, 20] } ] },
      score_new: { $add: [ { $multiply: [{ $toLong: "$createdAt" }, -1] }, { $multiply: ["$salesCount", 0.2] }, { $multiply: ["$views", 0.1] }, { $multiply: [{ $rand: {} }, 20] } ] }
    }
  },
  {
    $facet: {
      featuredProducts: [
        { $match: { featured: true } }, // ONLY featured
        { $sort: { score_featured: -1 } },
        { $limit: 30 }
      ],
      trendingProducts: [
        { $sort: { score_trending: -1 } },
        { $limit: 100 }
      ],
      bestSellers: [
        { $sort: { score_bestseller: -1 } },
        { $limit: 100 }
      ],
      newArrivals: [
        { $sort: { score_new: -1 } },
        { $limit: 100 }
      ]
    }
  }
]);

    // ----- Shuffle each section + slice top 8 -----
    const shuffleAndSlice = (arr, limit = 8) =>
      arr.sort(() => Math.random() - 0.5).slice(0, limit);

    const result = aggregated[0]; // $facet returns array with one object
    const response = {
      success: true,
      featuredProducts: shuffleAndSlice(result.featuredProducts),
      trendingProducts: shuffleAndSlice(result.trendingProducts),
      bestSellers: shuffleAndSlice(result.bestSellers),
      newArrivals: shuffleAndSlice(result.newArrivals)
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch homepage products"
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    // ⏱️ Safer date (for "new product" boost)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 1️⃣ Get all categories
    const categories = await Category.find().lean();

    // 2️⃣ Aggregate products
    const products = await Product.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $toLower: "$status" }, "active"]
          }
        }
      },

      // 3️⃣ Normalize category
      {
        $addFields: {
          normalizedCategory: {
            $trim: { input: { $toLower: "$category" } }
          }
        }
      },

      // 4️⃣ Smart scoring (ranking + freshness + randomness)
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$salesCount", 0.6] },
              { $multiply: ["$views", 0.3] },

              // ⭐ Featured boost
              {
                $cond: [{ $eq: ["$featured", true] }, 15, 0]
              },

              // 🔥 New product boost (last 3 days)
              {
                $cond: [
                  { $gte: ["$createdAt", threeDaysAgo] },
                  20,
                  0
                ]
              },

              // 🎲 Light randomness
              { $multiply: [{ $rand: {} }, 5] }
            ]
          }
        }
      },

      // 5️⃣ Sort by score
      { $sort: { score: -1 } },

      // 6️⃣ Group by category
      {
        $group: {
          _id: "$normalizedCategory",
          products: { $push: "$$ROOT" }
        }
      },

      // 7️⃣ Limit pool per category (performance)
      {
        $project: {
          products: { $slice: ["$products", 20] }
        }
      }
    ]);

    // 8️⃣ Convert aggregation to map
    const map = {};
    products.forEach(item => {
      map[item._id] = item.products;
    });

    // 9️⃣ Build final result (🚫 NO empty categories)
    const result = {};

    categories.forEach(cat => {
      const key = cat.name.trim().toLowerCase();

      if (map[key] && map[key].length > 0) {
        // 🎯 Keep ranking but add slight shuffle
        const topProducts = map[key].slice(0, 12);

        const shuffled = topProducts
          .sort((a, b) => b.score - a.score) // keep best first
          .slice(0, 12)
          .sort(() => Math.random() - 0.5)   // light shuffle
          .slice(0, 8);

        result[cat.name] = shuffled;
      }
    });

    // 🔥 Disable caching (fixes 304 issue)
    return res
      .set("Cache-Control", "no-store")
      .json({
        success: true,
        productsByCategory: result
      });

  } catch (err) {
    console.error("getProductsByCategory error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category"
    });
  }
};
export const getProductsBySingleCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    // Optional: pagination query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Fetch products
    const products = await Product.find({ 
      category: categoryName, 
      status: "Active" 
    })
    .sort({ createdAt: -1 }) // newest first
    .skip(skip)
    .limit(limit);

    // Count total for pagination
    const total = await Product.countDocuments({ category: categoryName, status: "Active" });

    res.json({
      success: true,
      category: categoryName,
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      products
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch products for this category" });
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
      images,
      seller,       // should match authenticated seller email
      variations    // optional
    } = req.body;

    if (!name || !description || !detailedDescription || !price || !stock || !category || !images || images.length < 2) {
      return res.status(400).json({ success: false, message: "Please fill all required fields and upload at least 2 images." });
    }

    if (images.length > 6) {
      return res.status(400).json({ success: false, message: "Maximum 6 images allowed." });
    }

    // Validate variations if provided
    if (variations && variations.length > 0) {
      for (const variation of variations) {
        if (!variation.option || !variation.values || variation.values.length === 0) {
          return res.status(400).json({ success: false, message: "Each variation must have an option name and at least one value." });
        }
        for (const val of variation.values) {
          if (typeof val.price !== "number" || val.price < 0) {
            return res.status(400).json({ success: false, message: "Variation price must be a number >= 0" });
          }
          if (typeof val.stock !== "number" || val.stock < 0) {
            return res.status(400).json({ success: false, message: "Variation stock must be a number >= 0" });
          }
        }
      }
    }

    // Create new product
    const newProduct = new Product({
      name,
      description,
      detailedDescription,
      price,
      stock,
      category,
      images,
      seller,       // already validated/authenticated in frontend
      variations: variations || []
    });

    await newProduct.save();

    res.status(201).json({ success: true, message: "Product added successfully", product: newProduct });

  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      detailedDescription,
      price,
      stock,
      category,
      status,
      existingImages, // JSON string of URLs the user kept
      variations      // JSON string of variations
    } = req.body;

    // 1. Fetch current product and verify ownership
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Security: verify seller email (from sellerAuth middleware)
    if (product.seller !== req.seller.email) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // 2. Image Logic: Identify what to keep, what to add, and what to delete
    let keptImages = [];
    if (existingImages) {
      keptImages = JSON.parse(existingImages);
    }

    // --- CLEANUP LOGIC: Delete images from Cloudinary that were removed by user ---
    const imagesToRemove = product.images.filter(img => !keptImages.includes(img));
    
    // We run this as a background task so it doesn't slow down the response
    Promise.all(imagesToRemove.map(url => deleteFromCloudinary(url)))
      .catch(err => console.error("Background Cleanup Error:", err));

    // 3. Handle NEW Uploads
    let newUploadUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Upload to Cloudinary (using your existing utility)
        const uploadedUrl = await uploadToCloudinary(file.path, "products");
        if (uploadedUrl) {
          newUploadUrls.push(uploadedUrl);
        }
        
        // IMPORTANT: If you are using local diskStorage with Multer, 
        // delete the temp file from your server after uploading to Cloudinary
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    const finalImagesList = [...keptImages, ...newUploadUrls];

    // 4. Final Validations
    if (finalImagesList.length < 2) {
      return res.status(400).json({ success: false, message: "Minimum 2 images required" });
    }

    if (finalImagesList.length > 6) {
      return res.status(400).json({ success: false, message: "Maximum 6 images allowed" });
    }

    // 5. Update the Database document
    const updateData = {
      name: name || product.name,
      description: description || product.description,
      detailedDescription: detailedDescription || product.detailedDescription,
      price: price !== undefined ? Number(price) : product.price,
      stock: stock !== undefined ? Number(stock) : product.stock,
      category: category || product.category,
      status: status || product.status,
      images: finalImagesList,
      variations: variations ? JSON.parse(variations) : product.variations
    };
   
    const oldStatus = product.status;
const newStatus = status || product.status;

if (oldStatus !== newStatus) {
  if (oldStatus === "Active" && newStatus !== "Active") {
    await Seller.updateOne(
      { _id: req.seller._id },
      { $inc: { activeListings: -1 } }
    );
  }

  if (oldStatus !== "Active" && newStatus === "Active") {
    await Seller.updateOne(
      { _id: req.seller._id },
      { $inc: { activeListings: 1 } }
    );
  }
}

   const updatedProduct = await Product.findByIdAndUpdate(
  id,
  { $set: updateData },
  { returnDocument: 'after' }
);
    res.status(200).json({ 
      success: true, 
      message: "Product updated successfully and storage cleaned", 
      product: updatedProduct 
    });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    // 1. Get seller email from middleware (sellerToken)
    const sellerEmail = req.seller.email;

    // 2. Fetch products for this seller
    const products = await Product.find({ seller: sellerEmail })
      .sort({ createdAt: -1 }); // newest first

    // 3. Response
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error("Error fetching seller products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller products"
    });
  }
};


export const getProductByIdForSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.seller.email;
    const product = await Product.findById(id);
    const categories = await Category.find().sort({ name: 1 });

    if (!product || product.seller !== email || !categories) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product,
      categories
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};


export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    // -------- TEXT SEARCH --------
    let products = await Product.aggregate([
      {
        $match: {
          status: "Active",
          $text: { $search: q }
        }
      },
      {
        $addFields: {
          textScore: { $meta: "textScore" }
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$textScore", 5], }, // relevance
              { $cond: [{ $eq: ["$featured", true] }, 20, 0] }, // featured
              { $multiply: ["$views", 0.3] }, // popularity
              { $multiply: ["$salesCount", 0.5] }, // sales
              { $multiply: [{ $rand: {} }, 10] } // randomness
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 50 }
    ]);

    // -------- FALLBACK (partial match like "pant") --------
    if (products.length === 0) {
      const regex = new RegExp(q, "i");

      products = await Product.find({
        status: "Active",
        $or: [
          { name: regex },
          { description: regex },
          { detailedDescription: regex },
          { category: regex }
        ]
      }).limit(50);
    }

    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
};

// ------------------ 1. Featured Products ------------------
export const getFeaturedProductsCursor = async (req, res) => {
  try {
    const limit = 20;
    const { lastScore, lastId } = req.query;

    const pipeline = [
      { $match: { status: "Active", featured: true } },

      {
        $addFields: {
          score: {
            $add: [
              30,
              { $multiply: ["$salesCount", 0.5] },
              { $multiply: ["$views", 0.3] }
            ]
          }
        }
      },

      // ✅ SORT FIRST
      { $sort: { score: -1, _id: -1 } }
    ];

    // ✅ CURSOR AFTER SORT
    if (
      lastScore !== undefined &&
      lastId &&
      mongoose.Types.ObjectId.isValid(lastId)
    ) {
      pipeline.push({
        $match: {
          $or: [
            { score: { $lt: Number(lastScore) } },
            {
              score: Number(lastScore),
              _id: { $lt: new mongoose.Types.ObjectId(lastId) }
            }
          ]
        }
      });
    }

    pipeline.push({ $limit: limit });

    let products = await Product.aggregate(pipeline);

    // ✅ ONLY FIRST LOAD FALLBACK
    if (!lastId && products.length < 8) {
      const extra = await Product.aggregate([
        {
          $match: {
            status: "Active",
            featured: true,
            _id: { $nin: products.map(p => p._id) }
          }
        },
        { $sample: { size: 8 - products.length } }
      ]);
      products = [...products, ...extra];
    }

    res.json({
      success: true,
      products,
      nextCursor: products.length
        ? {
            lastScore: products[products.length - 1].score,
            lastId: products[products.length - 1]._id
          }
        : null,
      hasMore: products.length === limit
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch featured products" });
  }
};

// ------------------ 2. Trending Products ------------------
export const getTrendingProductsCursor = async (req, res) => {
  try {
    const limit = 20;
    const { lastScore, lastId } = req.query;

    const pipeline = [
      { $match: { status: "Active" } },

      // ✅ Compute score
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$views", 1] },
              { $multiply: ["$salesCount", 0.3] }
            ]
          }
        }
      },

      // ✅ VERY IMPORTANT: Sort FIRST
      { $sort: { score: -1, _id: -1 } }
    ];

    // ✅ Apply cursor AFTER sorting
    if (
      lastScore !== undefined &&
      lastId &&
      mongoose.Types.ObjectId.isValid(lastId)
    ) {
      pipeline.push({
        $match: {
          $or: [
            { score: { $lt: Number(lastScore) } },
            {
              score: Number(lastScore),
              _id: { $lt: new mongoose.Types.ObjectId(lastId) }
            }
          ]
        }
      });
    }

    // ✅ Limit results
    pipeline.push({ $limit: limit });

    let products = await Product.aggregate(pipeline);

    // ✅ Fallback ONLY for first page
    if (!lastId && products.length < 8) {
      const extra = await Product.aggregate([
        {
          $match: {
            status: "Active",
            _id: { $nin: products.map(p => p._id) }
          }
        },
        { $sample: { size: 8 - products.length } }
      ]);
      products = [...products, ...extra];
    }

    res.json({
      success: true,
      products,

      nextCursor: products.length
        ? {
            lastScore: products[products.length - 1].score,
            lastId: products[products.length - 1]._id
          }
        : null,

      hasMore: products.length === limit
    });

  } catch (err) {
    console.error("🔥 Trending Error FULL:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending products"
    });
  }
};

// ------------------ 3. Best Sellers ------------------
export const getBestSellersCursor = async (req, res) => {
  try {
    const limit = 20;
    const { lastScore, lastId } = req.query;

    const pipeline = [
      { $match: { status: "Active" } },

      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$salesCount", 1] },
              { $multiply: ["$views", 0.3] }
            ]
          }
        }
      },

      // ✅ SORT FIRST
      { $sort: { score: -1, _id: -1 } }
    ];

    if (
      lastScore !== undefined &&
      lastId &&
      mongoose.Types.ObjectId.isValid(lastId)
    ) {
      pipeline.push({
        $match: {
          $or: [
            { score: { $lt: Number(lastScore) } },
            {
              score: Number(lastScore),
              _id: { $lt: new mongoose.Types.ObjectId(lastId) }
            }
          ]
        }
      });
    }

    pipeline.push({ $limit: limit });

    let products = await Product.aggregate(pipeline);

    if (!lastId && products.length < 8) {
      const extra = await Product.aggregate([
        {
          $match: {
            status: "Active",
            _id: { $nin: products.map(p => p._id) }
          }
        },
        { $sample: { size: 8 - products.length } }
      ]);
      products = [...products, ...extra];
    }

    res.json({
      success: true,
      products,
      nextCursor: products.length
        ? {
            lastScore: products[products.length - 1].score,
            lastId: products[products.length - 1]._id
          }
        : null,
      hasMore: products.length === limit
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch best sellers" });
  }
};

// ------------------ 4. New Arrivals ------------------
export const getNewArrivalsCursor = async (req, res) => {
  try {
    const limit = 20;
    const { lastScore, lastId } = req.query;

    const pipeline = [
      { $match: { status: "Active" } },

      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $toLong: "$createdAt" }, -1] },
              { $multiply: ["$salesCount", 0.2] },
              { $multiply: ["$views", 0.1] }
            ]
          }
        }
      },

      // ✅ SORT FIRST
      { $sort: { score: -1, _id: -1 } }
    ];

    if (
      lastScore !== undefined &&
      lastId &&
      mongoose.Types.ObjectId.isValid(lastId)
    ) {
      pipeline.push({
        $match: {
          $or: [
            { score: { $lt: Number(lastScore) } },
            {
              score: Number(lastScore),
              _id: { $lt: new mongoose.Types.ObjectId(lastId) }
            }
          ]
        }
      });
    }

    pipeline.push({ $limit: limit });

    let products = await Product.aggregate(pipeline);

    if (!lastId && products.length < 8) {
      const extra = await Product.aggregate([
        {
          $match: {
            status: "Active",
            _id: { $nin: products.map(p => p._id) }
          }
        },
        { $sample: { size: 8 - products.length } }
      ]);
      products = [...products, ...extra];
    }

    res.json({
      success: true,
      products,
      nextCursor: products.length
        ? {
            lastScore: products[products.length - 1].score,
            lastId: products[products.length - 1]._id
          }
        : null,
      hasMore: products.length === limit
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch new arrivals" });
  }
};


export const getProductsByCategoryCursor = async (req, res) => {
  try {
    const limit = 20;
    const { category } = req.body;
    const { lastScore, lastId } = req.query;

    if (!category || category.trim() === "") {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    const pipeline = [
      { $match: { status: "Active", category } },

      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$salesCount", 0.5] },
              { $multiply: ["$views", 0.3] },
              { $cond: [{ $eq: ["$featured", true] }, 15, 0] }
            ]
          }
        }
      },

      // ✅ SORT FIRST
      { $sort: { score: -1, _id: -1 } }
    ];

    if (
      lastScore !== undefined &&
      lastId &&
      mongoose.Types.ObjectId.isValid(lastId)
    ) {
      pipeline.push({
        $match: {
          $or: [
            { score: { $lt: Number(lastScore) } },
            {
              score: Number(lastScore),
              _id: { $lt: new mongoose.Types.ObjectId(lastId) }
            }
          ]
        }
      });
    }

    pipeline.push({ $limit: limit });

    let products = await Product.aggregate(pipeline);

    if (!lastId && products.length < 8) {
      const extra = await Product.aggregate([
        {
          $match: {
            status: "Active",
            category,
            _id: { $nin: products.map(p => p._id) }
          }
        },
        { $sample: { size: 8 - products.length } }
      ]);
      products = [...products, ...extra];
    }

    res.json({
      success: true,
      products,
      nextCursor: products.length
        ? {
            lastScore: products[products.length - 1].score,
            lastId: products[products.length - 1]._id
          }
        : null,
      hasMore: products.length === limit
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch products for this category" });
  }
};


