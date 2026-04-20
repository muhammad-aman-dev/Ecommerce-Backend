import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "seller",
    required: true
  },
  idFrontLink: {
    type: String,
    required: true
  },
  idBackLink: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Suspended"],
    default: "Active"
  },
  sales: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  remainingPayout: {
    type: Number,
    default: 0
  },
  listings: {
    type: Number,
    default : 0
  },
  activeListings: {
    type: Number,
    default : 0
  },
  payoutDetails: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    iban: String,
    swiftCode: String,
    country: String
  },
  rating: {
    type: Number,
    default : 0
  },
  numReviews: {
    type: Number,
    default : 0
  }
}, {
  timestamps: true 
},{ collection : 'Sellers'});


sellerSchema.pre("save", async function () {

  if (!this.password) return

  if (!this.isModified("password")) return

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)

})

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller;