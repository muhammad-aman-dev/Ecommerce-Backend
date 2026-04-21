import mongoose from "mongoose";

const RefundRequestSchema = new mongoose.Schema(
  {
    // Plain String ID to avoid strict Mongoose referencing
    orderId: { 
      type: String, 
      required: true,
      unique: true // Still ensures only one request exists per order
    },
    
    // Tracking details copied from the Order for easy Admin viewing
    orderDisplayId: { type: String, required: true }, // e.g., "ORD-104086"
    buyerEmail: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    
    // Financial data
    amountUSD: { type: Number, required: true },
    amountLocal: { type: Number, required: true },
    currency: { type: String, required: true },

    // The "Why" (From Buyer's Swal)
    reason: { type: String, required: true },
    message: { type: String, required: true },

    // The "Action" (From Admin's Swal)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    adminNote: { type: String, default: "" }, 
    
    processedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.RefundRequest || mongoose.model("RefundRequest", RefundRequestSchema);