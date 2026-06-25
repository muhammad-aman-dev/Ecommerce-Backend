import mongoose from "mongoose";

const payoutRequestSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true
    },

    sellerName: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    contact: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    payoutDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      iban: String,
      swiftCode: String,
      country: String
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Paid"],
      default: "Pending"
    }
  },
  {
    timestamps: true,
    collection: "PayoutRequests"
  }
);

const PayoutRequest = mongoose.model(
  "PayoutRequest",
  payoutRequestSchema
);

export default PayoutRequest;