import SellerSupport from "../models/SellerSupport.js";

export const sendSupportMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;

    const newTicket = new SellerSupport({
      sellerName: req.seller.name,
      sellerEmail: req.seller.email,
      subject,
      message
    });

    await newTicket.save();
    res.status(201).json({ success: true, message: "Inquiry submitted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerMessageHistory = async (req, res) => {
  try {
    const history = await SellerSupport.find({ sellerEmail: req.seller.email })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, messages: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};