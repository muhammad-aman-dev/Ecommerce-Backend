import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
{
  percentage: {
    type: Number,
    required: true,
    min: 1,
    max: 90
  },

  adminEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }

},
{
  timestamps: true,
  collection: "Discount"
});

export default mongoose.models.Discount ||
mongoose.model("Discount", discountSchema);