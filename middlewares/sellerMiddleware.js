import jwt from "jsonwebtoken"
import Seller from "../models/Seller.js"

export const sellerAuth = async (req, res, next) => {
  try {
    const token = req.cookies.sellerToken

    if (!token) {
      return res.status(400).json({ message: "Not authenticated" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const seller = await Seller.findById(decoded.id)

    if (!seller) {
      return res.status(400).json({ message: "Not authenticated" })
    }

    // Attach seller info to request for further use if needed
    req.seller = seller
    next()
  } catch (err) {
    console.error(err)
    return res.status(400).json({ message: "Not authenticated" })
  }
}