import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
  dp: {type: String, default : null},
  name: String,
  email: { type: String, unique: true },
  password: String,       
  googleId: String,
  isVerified: { type: Boolean, default: false },
  payToken: { type: String, default: null }
}, { timestamps: true })

// Hash password before saving
userSchema.pre("save", async function () {

  if (!this.password) return

  if (!this.isModified("password")) return

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)

})

// Password verification method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

export default mongoose.model("User", userSchema)