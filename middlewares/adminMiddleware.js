import jwt from "jsonwebtoken"
import Admin from "../models/Admin.js"

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.adminToken

    if (!token) {
      return res.status(400).json({ message: "Not authenticated" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await Admin.findById(decoded.id)

    if (!admin) {
      return res.status(400).json({ message: "Not authenticated" })
    }

    // Attach admin info to request for further use if needed
    req.admin = admin
    next()
  } catch (err) {
    console.error(err)
    return res.status(400).json({ message: "Not authenticated" })
  }
}