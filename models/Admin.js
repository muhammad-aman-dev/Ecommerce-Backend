// models/Otp.js
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
}, { timestamps: true },{ collection : 'Admin'})

adminSchema.pre("save", async function () {

  if (!this.password) return

  if (!this.isModified("password")) return

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)

})

export default mongoose.model("Admin", adminSchema)