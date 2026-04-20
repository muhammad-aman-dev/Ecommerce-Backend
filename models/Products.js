import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const productSchema = new mongoose.Schema(
{
  // Unique Product ID
  productId: {
    type: String,
    unique: true,
    default: () => `PRD-${uuidv4().slice(0,7).toUpperCase()}`
  },

  // Basic product info
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  detailedDescription: { type: String, required: true, trim: true },
  category: { type: String, required: true },

  // Base price & stock (used if product has no variations)
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0 },

  // Images (2-6 images per product)
  images: { type: [String], required: true },

  // Seller info
  seller: { type: String, required: true, trim: true, lowercase: true },
  sellerName: { type: String, required: true },
  sellerId: { type: String, required: true },

  // Product status
  status: { type: String, enum: ["Active","Suspended","Out Of Stock","Suspended By Admin"], default: "Active" },

  // Homepage featured
  featured: { type: Boolean, default: false },

  // Analytics
  views: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },

  // Product variations with individual prices & stock
  variations: {
    type: [
      {
        option: { type: String, trim: true }, // e.g., Size, Color
        values: [
          {
            value: { type: String, trim: true }, // e.g., Large, Red
            price: { type: Number, default: 0 }, // price adjustment relative to base
            stock: { type: Number, default: 0 }  // stock for this specific variation
          }
        ]
      }
    ],
    default: [],
  }

},
{
  timestamps: true,
  collection: "Product"
});


productSchema.index({ status: 1, category: 1 });

productSchema.index(
  {
    name: "text",
    description: "text",
    detailedDescription: "text",
    category: "text"
  },
  {
    weights: {
      name: 5,
      category: 3,
      description: 2,
      detailedDescription: 1
    }
  }
);


// ⚡ PERFORMANCE INDEX (for sorting)
productSchema.index({ status: 1, featured: 1, views: -1, salesCount: -1, createdAt: -1 });

export default mongoose.models.Product || mongoose.model("Product", productSchema);