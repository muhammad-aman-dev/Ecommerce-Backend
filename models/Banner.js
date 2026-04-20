// models/Banner.js
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    imageLink: {
      type: String,
      required: true,
      trim: true,
    },
    ref: {
      type: String, // link where banner redirects (product/category/page)
      required: true,
      trim: true,
    },
    title: {
      type: String, // e.g. "50% Discount"
      required: true,
      trim: true,
      maxlength: 120,
    },
  },
  {
    collection: "Banners",
    timestamps: true,
  }
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;