import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: () => `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    userId: { type: String, required: true },

    // Buyer information
    buyer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: {
        line1: { type: String, required: true },
        line2: String,
        city: { type: String, required: true },
        state: String,
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
      },
    },

    sellerName : {
    type: String,
    required: true
    },
    sellerEmail : {
    type: String,
    required: true
    },

    // Items in the order
    items: [
      {
        productId: { type: String, required: true },
        name: String,
        image: String,
        variations: Object,
        quantity: Number,
        priceUSD: Number,
        priceLocal: Number,
        stock: Number,
        sellerEmail: { type: String, required: true },
        sellerName: { type: String, required: true },
        sellerStatus: {
          type: String,
          enum: ["pending", "shipped", "delivered", "cancelled"],
          default: "pending",
        },
      },
    ],

    currency: { type: String, default: "USD" },
    exchangeRates: Object,
    totalAmountUSD: Number,
    totalAmountLocal: Number,

    // Statuses
    buyerStatus: {
      type: String,
      enum: ["pending", "received", "cancelled"],
      default: "pending",
    },
    sellerStatus: {
        type: String,
        enum: ["pending", "shipped", "delivered", "cancelled"], 
        default: "pending"
      },
    buyerStatusUpdateDate: {
      type: Date
     },
     dispatchedAt: {
       type: Date
     },
     payoutEligibleDate: { 
  type: Date
},
isPaidToSeller: { 
  type: Boolean, 
  default: false 
},
refundStatus: {
  type: String,
  enum: ["none", "requested", "approved", "rejected"],
  default: "none"
},
    // Payment details (Safepay integration)
    payment: {
      provider: { type: String, default: "safepay" },
      paymentId: { type: String, required: true }, // Safepay invoice token
      paymentUrl: { type: String, required: true }, // Safepay checkout URL
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      method: { type: String, default: "card" },
      amountPaidUSD: Number,
      amountPaidLocal: Number,
      paidAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);