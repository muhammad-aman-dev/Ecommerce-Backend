import jwt from "jsonwebtoken"
import Users from "../models/Users.js"

export const userAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(400).json({ message: "Not authenticated" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await Users.findById(decoded.id)

    if (!user) {
      return res.status(400).json({ message: "Not authenticated" })
    }

    
    req.user = user
    next()
  } catch (err) {
    console.error(err)
    return res.status(400).json({ message: "Not authenticated" })
  }
}