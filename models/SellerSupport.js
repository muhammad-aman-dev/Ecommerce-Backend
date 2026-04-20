import mongoose from "mongoose";

const sellerSupport = new mongoose.Schema(
  {
    sellerName: {
      type: String,
      required: true
    },
    sellerEmail: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Rejected", "Solved"],
        default: "Pending"
    }
  },
  { timestamps: true }
);

export default mongoose.models.SellerSupport || mongoose.model("SellerSupport", sellerSupport);