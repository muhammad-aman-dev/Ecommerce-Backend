import express from "express";

const logoutrouter = express.Router();

// Logout Seller
logoutrouter.post('/seller', (req, res) => {
  res
    .clearCookie("sellerToken", { httpOnly: true })
    .status(200)
    .json({ message: "Seller logged out successfully" });
});

// Logout Admin
logoutrouter.post('/admin', (req, res) => {
  res
    .clearCookie("adminToken", { httpOnly: true })
    .status(200)
    .json({ message: "Admin logged out successfully" });
});

export default logoutrouter;