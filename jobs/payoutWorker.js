import cron from "node-cron";
import Order from "../models/Orders.js";
import Seller from "../models/Seller.js";

cron.schedule("0 0 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Starting matured payouts check...`);

  try {
    const now = new Date();

    const payoutQuery = {
      buyerStatus: "received",
      isPaidToSeller: false,
      payoutEligibleDate: { $ne: null, $lte: now },
      $or: [
        { refundStatus: "none" },
        { refundStatus: "rejected" }
      ]
    };

    const maturedOrders = await Order.find(payoutQuery);

    if (maturedOrders.length === 0) {
      console.log("No matured orders found today.");
      return;
    }

    console.log(`Found ${maturedOrders.length} orders to process.`);

    const processedOrderIds = [];

    for (const order of maturedOrders) {
      try {
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

        if (sellerUpdate.modifiedCount > 0) {
          processedOrderIds.push(order._id);
        }
      } catch (err) {
        console.error(`Error processing order ${order._id}:`, err);
      }
    }

    if (processedOrderIds.length > 0) {
      await Order.updateMany(
        {
          _id: { $in: processedOrderIds },
          isPaidToSeller: false // 🔒 safety check
        },
        {
          $set: { isPaidToSeller: true }
        }
      );

      console.log(`Credited ${processedOrderIds.length} orders.`);
    }

  } catch (error) {
    console.error("Critical error in payout cron job:", error);
  }
});