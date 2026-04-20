import Order from "../models/Orders.js";
import safepayClient from "../config/safePay.js";
import Seller from "../models/Seller.js"
import Product from "../models/Products.js"
import nodemailer from "nodemailer";


const sendOrderConfirmationEmail = async (order) => {
  // Setup Transporter (Use Environment Variables)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Generate Items Rows dynamically
  const itemsHtml = order.items.map(item => {
    // Extract variations like { color: "white", Size: "Small" }
    const variationsText = item.variations 
      ? Object.entries(item.variations)
          .map(([key, val]) => `<span style="color: #64748b; font-size: 11px;">${key}: ${val}</span>`)
          .join(' | ')
      : '';

    return `
      <tr>
        <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
          <div style="display: flex; align-items: center;">
            <img src="${item.image}" width="60" height="60" style="border-radius: 12px; object-fit: cover; margin-right: 15px; border: 1px solid #e2e8f0;"/>
            <div>
              <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 14px;">${item.name}</p>
              ${variationsText ? `<p style="margin: 4px 0 0 0;">${variationsText}</p>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b; font-weight: 600;">x${item.quantity}</td>
        <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a;">
          ${order.currency} ${item.priceLocal.toLocaleString()}
        </td>
      </tr>
    `;
  }).join('');

  const mailOptions = {
    from: `"Tradexon Support" <${process.env.EMAIL_USER}>`,
    to: order.buyer.email,
    subject: `Success! Order Confirmed #${order.orderId}`,
    html: `
      <div style="background-color: #f8fafc; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          
          <div style="background: #0f172a; padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -1px;">TRADEXON</h1>
            <div style="display: inline-block; margin-top: 15px; padding: 6px 16px; background: #10b981; color: white; border-radius: 100px; font-size: 12px; font-weight: 800; text-transform: uppercase;">
              Payment Received
            </div>
          </div>

          <div style="padding: 40px;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px;">Hi ${order.buyer.name},</h2>
            <p style="margin: 0; color: #64748b; line-height: 1.6;">Your order <strong>${order.orderId}</strong> has been confirmed and is being processed by <strong>${order.sellerName}</strong>.</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;">Product</th>
                  <th style="text-align: center; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;">Qty</th>
                  <th style="text-align: right; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top: 20px; text-align: right;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Total Paid (${order.currency})</p>
              <h2 style="margin: 5px 0 0 0; color: #0f172a; font-size: 24px;">${order.currency} ${order.totalAmountLocal.toLocaleString()}</h2>
            </div>

            <div style="margin-top: 40px; padding: 25px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8;">Delivery Details</h4>
              <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 600;">${order.buyer.address.line1}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">${order.buyer.address.city}, ${order.buyer.address.postalCode}</p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #1e293b; font-weight: 600;">📞 ${order.buyer.phone}</p>
            </div>

            <div style="margin-top: 40px; text-align: center;">
              <a href="http://localhost:3000/my-orders" style="display: inline-block; padding: 16px 32px; background: #0f172a; color: white; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px;">Track My Order</a>
            </div>
          </div>

          <div style="padding: 30px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Thank you for shopping with Tradexon.</p>
          </div>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/* ---------------- HELPERS ---------------- */

const getCountryCode = (country) => {
  if (!country) return "PK";
  const map = {
    pakistan: "PK",
    india: "IN",
    usa: "US",
    unitedstates: "US",
    uk: "GB",
    unitedkingdom: "GB",
  };

  const key = String(country).toLowerCase().trim();
  return map[key] || String(country).toUpperCase();
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getLocalPrice = (item, exchangeRates) => {
  if (item.priceLocal !== undefined && item.priceLocal !== null && item.priceLocal !== "") {
    return toNumber(item.priceLocal);
  }

  const usd = toNumber(item.priceUSD);
  const rate = toNumber(exchangeRates?.PKR, 1);
  return usd * rate;
};

const normalizeItems = (items, exchangeRates) => {
  return items.map((item) => {
    const sellerEmail = item.sellerEmail || item.seller;

    if (!sellerEmail) {
      throw new Error(`Missing seller for product ${item.productId || "unknown"}`);
    }

    const quantity = Math.max(1, toNumber(item.quantity, 1));
    const priceUSD = toNumber(item.priceUSD);
    const priceLocal = getLocalPrice(item, exchangeRates);

    return {
      ...item,
      sellerEmail,
      sellerName: item.sellerName || "Unknown Seller",
      quantity,
      priceUSD,
      priceLocal,
    };
  });
};

const groupItemsBySeller = (items) => {
  return items.reduce((acc, item) => {
    const sellerKey = item.sellerEmail;

    if (!acc[sellerKey]) {
      acc[sellerKey] = {
        sellerEmail: item.sellerEmail,
        sellerName: item.sellerName,
        items: [],
      };
    }

    acc[sellerKey].items.push(item);
    return acc;
  }, {});
};

const getOrCreateCustomer = async (buyer) => {
  const customer = await safepayClient.customers.object.create({
    first_name: buyer.firstName || "Guest",
    last_name: buyer.lastName || "User",
    email: buyer.email,
    phone_number: buyer.phone || "+920000000000",
    country: getCountryCode(buyer.country),
    is_guest: true,
  });

  return customer.data;
};

/* ---------------- CREATE INVOICE ---------------- */

export const createInvoice = async (req, res) => {
  try {
    const { items, buyer, currency, totalAmount, exchangeRates, totalUSD } = req.body;

    if (!buyer) {
      return res.status(400).json({ message: "Buyer data is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const fullName =
      buyer.fullName || `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim();

    const normalizedItems = normalizeItems(items, exchangeRates);
    const customer = await getOrCreateCustomer(buyer);

    const checkoutCurrency = currency || "PKR";
    const checkoutAmount =
      checkoutCurrency === "USD" ? toNumber(totalUSD) : toNumber(totalAmount);

    if (!checkoutAmount || checkoutAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    const sessionResponse = await safepayClient.payments.session.setup({
      merchant_api_key: "sec_ae9edbd5-ce6f-48fa-ad3f-539195febc04",
      user: customer.token,
      entry_mode: "raw",
      intent: "CYBERSOURCE",
      mode: "payment",
      currency: checkoutCurrency,
      amount: Math.round(checkoutAmount * 100),
      metadata: {
        order_id: `order_${buyer.userId || buyer.email || Date.now()}`,
      },
      include_fees: false,
      environment: "sandbox",
    });

    const authResponse = await safepayClient.client.passport.create({
      user_id: customer.token,
    });

    const tbt = authResponse?.data;
    const trackerToken = sessionResponse?.data?.tracker?.token;

    if (!trackerToken) {
      throw new Error("Failed to create tracker");
    }

    const checkoutURL = await safepayClient.checkout.createCheckoutUrl({
      env: "sandbox",
      tbt,
      tracker: trackerToken,
      source: "popup",
      redirect_url: `http://localhost:3000/order/success`,
      cancel_url: `http://localhost:3000/order/cancel`,
    });

    const grouped = groupItemsBySeller(normalizedItems);
    const createdOrders = [];

    for (const sellerEmail of Object.keys(grouped)) {
      const sellerGroup = grouped[sellerEmail];

      const sellerTotalUSD = sellerGroup.items.reduce(
        (sum, i) => sum + toNumber(i.priceUSD) * toNumber(i.quantity, 1),
        0
      );

      const sellerTotalLocal = sellerGroup.items.reduce(
        (sum, i) => sum + toNumber(i.priceLocal) * toNumber(i.quantity, 1),
        0
      );
      const finalPaidAmount = checkoutCurrency === "USD" ? sellerTotalUSD : sellerTotalLocal;

      const newOrder = new Order({
        userId: buyer.userId,

        buyer: {
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          name: fullName,
          email: buyer.email,
          phone: buyer.phone,
          address: {
            line1: buyer.address,
            city: buyer.city,
            postalCode: buyer.postalCode,
            country: getCountryCode(buyer.country),
          },
        },

        sellerName: sellerGroup.sellerName,
        sellerEmail: sellerGroup.sellerEmail,
        items: sellerGroup.items,

        currency: checkoutCurrency,
        totalAmountUSD: Number(sellerTotalUSD.toFixed(2)),
        totalAmountLocal: checkoutCurrency === "USD" 
  ? Number(finalPaidAmount.toFixed(2)) 
  : Math.round(finalPaidAmount),
        exchangeRates,

        payment: {
          paymentId: trackerToken,
          paymentUrl: checkoutURL,
          status: process.env.NODE_ENV === "development"||process.env.NODE_ENV === "production"?"paid":"pending",
        },
      });

      await newOrder.save();
      createdOrders.push(newOrder);
    }

    return res.status(200).json({
      paymentUrl: checkoutURL,
      orderIds: createdOrders.map((o) => o._id.toString()),
    });
  } catch (error) {
    console.error("===== SAFEPAY ERROR =====", error);
    return res.status(500).json({ message: error.message });
  }
};

/* ---------------- WEBHOOK ---------------- */

export const safepayWebhook = async (req, res) => {
  try {
    console.log("📩 Webhook received:", JSON.stringify(req.body, null, 2));

    const tracker = req.body?.data?.tracker;

    if (!tracker?.token) {
      console.log("❌ No tracker token found");
      return res.status(400).send("No tracker found");
    }

    console.log("🔑 Token:", tracker.token);

    let paymentStatus;

    if (process.env.NODE_ENV === "development") {
      console.log("⚠️ DEV MODE: Mocking payment as PAID");
      paymentStatus = "paid";
    } else {
      const verification = await safepayClient.reporter.payments.fetch(tracker.token);
      paymentStatus = String(verification?.data?.status || "").toLowerCase();
    }

    console.log("💳 Payment Status:", paymentStatus);

    if (paymentStatus !== "paid") {
      console.log("⛔ Payment not completed");
      return res.sendStatus(200);
    }

    // ✅ Find orders linked to this payment
    const orders = await Order.find({
      "payment.paymentId": tracker.token,
    });

    console.log("📦 Orders found:", orders.length);

    if (!orders.length) {
      console.log("❌ No orders found for this token");
      return res.sendStatus(200);
    }

    for (const order of orders) {
      console.log("➡️ Processing order:", order.orderId);

      // ✅ Prevent duplicate processing
      if (order.payment?.status === "paid") {
        console.log("⚠️ Already processed, skipping:", order.orderId);
        continue;
      }

      // ✅ Mark order as paid
      order.payment.status = "paid";
      order.payment.paidAt = new Date();
      order.payment.amountPaidUSD = order.totalAmountUSD;
      order.buyerStatus = "pending";

      await order.save();

      const sellerEmail = order.sellerEmail;
      if (!sellerEmail) {
        console.log("❌ Missing sellerEmail in order:", order.orderId);
        continue;
      }

      // ✅ Increment seller sales (number of items sold)
      const totalItems = order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
      await Seller.updateOne(
        { email: sellerEmail },
        { $inc: { sales: totalItems } }
      );

      // ✅ Update product stock & sales
      for (const item of order.items) {
        const product = await Product.findOne({ productId: item.productId });
        if (!product) {
          console.log("⚠️ Product not found:", item.productId);
          continue;
        }

        const qty = Number(item.quantity) || 1;

        // Base stock
        product.stock = Math.max(0, product.stock - qty);

        // Variation stock
        if (product.variations?.length && item.variations) {
          for (const [option, value] of Object.entries(item.variations)) {
            const variation = product.variations.find(
              (v) => v.option.toLowerCase() === option.toLowerCase()
            );

            if (!variation) continue;

            const val = variation.values.find(
              (v) => v.value.toLowerCase() === String(value).toLowerCase()
            );

            if (val) {
              val.stock = Math.max(0, val.stock - qty);
            }
          }
        }

        // Sales count
        product.salesCount = (product.salesCount || 0) + qty;

        // Stock status
        if (product.stock <= 0) {
          product.status = "Out Of Stock";
        }

        await product.save();
      }
      try {
        await sendOrderConfirmationEmail(order);
        console.log(`✅ Confirmation sent to: ${order.buyer.email}`);
    } catch (err) {
        console.error("❌ Email failed but order is processed:", err);
    }
    }

    console.log("✅ Webhook processing completed (sales & stock updated)");

    // 💡 No revenue/remainingPayout update here — will do on delivery

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).send("Webhook Failed");
  }
};