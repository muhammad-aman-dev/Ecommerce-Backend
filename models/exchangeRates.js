import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema(
  {
    baseCurrency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    rates: {
      type: Map,
      of: Number,
      required: true,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "ExchangeRates",
  }
);

const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);

export default ExchangeRate;