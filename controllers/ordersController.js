import Order from "../models/Orders.js"
import Seller from "../models/Seller.js";

export const getMyOrders = async (req, res) => {
  try {
      const orders = await Order.find({
      userId: req.user.id,
      "payment.status": { $ne: "pending" }
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateBuyerStatus = async (req, res) => {
  try {
    const { buyerStatus, rating } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (buyerStatus === "received") {
      order.buyerStatus = "received";
      order.buyerStatusUpdateDate = new Date();
      const delay = 7 * 24 * 60 * 60 * 1000; 
      order.payoutEligibleDate = new Date(Date.now() + delay);
    }

    // ✅ If rating is provided, update seller rating
    if (rating !== undefined) {
      const seller = await Seller.findOne({ email: order.sellerEmail });

      if (seller) {
        // Initialize if not present
        seller.numReviews = seller.numReviews || 0;
        seller.rating = seller.rating || 0;

        // Calculate new average rating
        seller.rating =
          (seller.rating * seller.numReviews + rating) /
          (seller.numReviews + 1);

        seller.numReviews += 1;

        await seller.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Status updated",
      order
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerEmail = req.seller.email;
    const orders = await Order.find({
      sellerEmail: sellerEmail,
      "payment.status": { $ne: "pending" }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateSellerStatus = async (req, res) => {
  try {
    const { sellerStatus } = req.body; 
    const sellerEmail = req.seller.email;
     const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

      if (order.sellerEmail !== sellerEmail) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // NEW: Logic for Rejecting (Cancelled)
    if (sellerStatus === "cancelled") {
      // Check: You can only reject if it hasn't been shipped yet
      if (order.sellerStatus !== "pending") {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot reject an order that is already processed or shipped." 
        });
      }
      order.cancelledAt = new Date(); // Track when it was rejected
    }
    // Logic for Shipping
    if (sellerStatus === "shipped") {
      order.dispatchedAt = new Date();
    }
    
    // Update main status
    order.sellerStatus = sellerStatus;

    // Sync all nested items
    order.items = order.items.map(item => ({
      ...item,
      sellerStatus: sellerStatus
    }));

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: `Order has been ${sellerStatus === 'cancelled' ? 'rejected' : sellerStatus}.`, 
      order 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};