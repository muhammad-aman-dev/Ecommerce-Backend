import cron from "node-cron";
import Order from "../models/Orders.js";
import Seller from "../models/Seller.js";

cron.schedule("0 0 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Starting matured payouts check...`);

  try {
    const now = new Date();

    // 1. Fetch matured orders (limited to current memory safety)
    const maturedOrders = await Order.find({
      buyerStatus: "received",
      isPaidToSeller: false,
      payoutEligibleDate: { $lte: now },
      refundStatus: { $ne: "approved" }
    });

    if (maturedOrders.length === 0) {
      console.log("No matured orders found today.");
      return;
    }

    console.log(`Found ${maturedOrders.length} orders to process.`);

    const processedOrderIds = [];

    // 2. Process each order
    for (const order of maturedOrders) {
      try {
        // Use $inc for atomic updates. This prevents "lost updates" if the 
        // seller document is edited elsewhere simultaneously.
        const sellerUpdate = await Seller.updateOne(
          { email: order.sellerEmail },
          { 
            $inc: { 
              revenue: order.totalAmountUSD, 
              remainingPayout: order.totalAmountUSD, 
              sales: 1 
            } 
          }
        );

        // Only mark the order as paid if the seller update actually succeeded
        if (sellerUpdate.modifiedCount > 0) {
          processedOrderIds.push(order._id);
        } else {
          console.warn(`Warning: Could not update seller for order ${order._id}. Seller might not exist.`);
        }
      } catch (err) {
        console.error(`Error processing order ${order._id}:`, err);
      }
    }

    // 3. Bulk update orders to 'isPaidToSeller: true'
    if (processedOrderIds.length > 0) {
      await Order.updateMany(
        { _id: { $in: processedOrderIds } },
        { $set: { isPaidToSeller: true } }
      );
      console.log(`Successfully credited ${processedOrderIds.length} orders to sellers.`);
    }

  } catch (error) {
    console.error("Critical error in payout cron job:", error);
  }
});