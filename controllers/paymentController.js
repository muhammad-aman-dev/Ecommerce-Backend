import Order from "../models/Orders.js";
import Seller from "../models/Seller.js"
import Product from "../models/Products.js"
import nodemailer from "nodemailer";
import crypto from 'crypto';


/* --- EMAIL: For the Buyer --- */
const sendOrderConfirmationEmail = async (order) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const itemsHtml = order.items.map(item => {
    const variationsText = (item.variations && Object.keys(item.variations).length > 0)
      ? Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(' | ') 
      : 'Standard Edition';
    
    const unitPrice = order.currency === "USD" ? item.priceUSD : item.priceLocal;

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: top; width: 64px;">
                <img src="${item.image}" alt="${item.name}" width="60" height="60" style="border-radius:8px; border: 1px solid #e2e8f0; display: block; object-fit: cover;">
              </td>
              <td style="padding-left: 12px; vertical-align: middle;">
                <p style="margin: 0; font-family: sans-serif; font-size: 14px; font-weight: 600; color: #1e293b;">${item.name}</p>
                <p style="margin: 2px 0 0; font-family: sans-serif; font-size: 12px; color: #64748b;">${variationsText}</p>
              </td>
            </tr>
          </table>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-family: sans-serif; font-size: 14px; color: #1e293b; font-weight: 500;">
          ${order.currency} ${unitPrice.toLocaleString()} x ${item.quantity}
        </td>
      </tr>`;
  }).join('');

  const finalTotal = order.currency === "USD" ? order.totalAmountUSD : order.totalAmountLocal;

  const mailOptions = {
    from: `"Tradexon" <${process.env.EMAIL_USER}>`,
    to: order.buyer.email,
    subject: `Your Tradexon order is confirmed! (#${order.orderId})`,
    html: `
      <div style="background-color: #f8fafc; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Tradexon</h1>
              <p style="color: #94a3b8; margin: 10px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Confirmed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #0f172a; margin: 0;">Hi ${order.buyer.name},</p>
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 15px 0 25px 0;">
                Woot woot! We've received your order and the seller is already getting things ready. Here's a summary of what you bought.
              </p>

              <!-- Order Summary Table -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th align="left" style="padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase;">Items</th>
                    <th align="right" style="padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="right" style="padding-top: 10px;">
                    <span style="font-size: 14px; color: #64748b;">Total Amount Paid</span>
                    <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #4f46e5;">${order.currency} ${finalTotal.toLocaleString()}</p>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin: 40px 0 20px 0;">
                <a href="${process.env.FRONTEND_URL}/profile" style="background-color: #4f46e5; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Track Your Order
                </a>
              </div>

              <!-- Shipping Info -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">Shipping To</h4>
                <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                  <strong>${order.buyer.name}</strong><br>
                  ${order.buyer.address.line1}<br>
                  ${order.buyer.address.city}, ${order.buyer.address.postalCode}<br>
                  ${order.buyer.address.country}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Questions? We're here to help.</p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">
                &copy; 2026 Tradexon Marketplace. All rights reserved.<br>
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </div>`
  };
  
  return transporter.sendMail(mailOptions);
};

/* --- EMAIL: For the Seller --- */
const sendSellerNotificationEmail = async (order) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const itemsList = order.items.map(item => {
    const vars = (item.variations && Object.keys(item.variations).length > 0)
      ? `(${Object.entries(item.variations).map(([k,v]) => `${v}`).join(', ')})` 
      : '';
    return `<li style="margin-bottom: 10px;"><strong>${item.name}</strong><br><span style="color: #64748b;">Quantity: ${item.quantity} ${vars}</span></li>`;
  }).join('');

  const mailOptions = {
    from: `"Tradexon Sales" <${process.env.EMAIL_USER}>`,
    to: order.sellerEmail,
    subject: `New Sale: ${order.orderId} - Fulfill Now`,
    html: `
      <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #1e293b;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #0f172a;">You've got an order!</h2>
          <p style="color: #64748b; margin: 5px 0 0;">Order #${order.orderId}</p>
        </div>
        
        <p>Hi <strong>${order.sellerName}</strong>,</p>
        <p>Customer <strong>${order.buyer.name}</strong> has just purchased the following:</p>
        
        <ul style="padding-left: 20px;">${itemsList}</ul>

        <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 5px 0; color: #9a3412;">Deliver To:</h4>
          <p style="margin: 0; font-size: 14px;">
            ${order.buyer.address.line1}<br>
            ${order.buyer.address.city}, ${order.buyer.address.postalCode}<br>
            <strong>Phone:</strong> ${order.buyer.phone}
          </p>
        </div>

        <a href="${process.env.FRONTEND_URL}/seller/dashboard/orders" 
           style="display: block; text-align: center; background: #0f172a; color: white; padding: 14px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 25px;">
           Process Order
        </a>
      </div>`
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

const createPayment = async (basketId, amount, currency) => {
  // 1. GET ACCESS TOKEN FROM PAYFAST
  const body = new URLSearchParams({
    MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID,
    SECURED_KEY: process.env.PAYFAST_SECURED_KEY,
    BASKET_ID: basketId,
    TXNAMT: amount,
    CURRENCY_CODE: currency,
  });

  const response = await fetch(process.env.PAYFAST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayFast token request failed: ${errorText}`);
  }

  const data = await response.json();
  const token = data.ACCESS_TOKEN;

  return {
    actionUrl: process.env.PAYFAST_POST_URL,
    basketId,
    token,
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    amount,
    fields: {
      MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID,
      TOKEN: token,
      BASKET_ID: basketId,
      TXNAMT: amount,
      CURRENCY_CODE: "PKR",
      SUCCESS_URL: `${process.env.FRONTEND_URL}/payfast/return?result=success&basketId=${basketId}`,
      FAILURE_URL: `${process.env.FRONTEND_URL}/payfast/return?result=failure&basketId=${basketId}`,
      CHECKOUT_URL: `${process.env.BACKEND_URL}/payment/webhook/payfast-direct`,
      ORDER_DATE: new Date().toISOString(),
      TXNDESC: "Package Purchase",
      PROCCODE: "00",
      TRAN_TYPE: "ECOMM_PURCHASE", 
    },
  };
};

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

    const checkoutCurrency = currency || "PKR";
    const checkoutAmount =
      checkoutCurrency === "USD" ? toNumber(totalUSD) : toNumber(totalAmount);

    if (!checkoutAmount || checkoutAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

 
    const paymentAmount =
  currency === "USD"
    ? Number((totalUSD * exchangeRates?.PKR).toFixed(2))
    : Number(totalAmount);
    const random7Digits = Math.floor(1000000 + Math.random() * 9000000);
    const basketId = `ORDER-${random7Digits}-${Date.now()}`;
    

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
          paymentId: basketId,
          status:"pending",
        },
      });

      await newOrder.save();
      createdOrders.push(newOrder);
   
    }

    const payment = await createPayment(basketId, paymentAmount, "PKR");

    return res.status(200).json({
      payment,
      orderIds: createdOrders.map((o) => o._id.toString()),
    });
  } catch (error) {
    console.error("===== SAFEPAY ERROR =====", error);
    return res.status(500).json({ message: error.message });
  }
};


const processPaidOrders = async (basketId) => {
  const orders = await Order.find({
    "payment.paymentId": basketId,
  });

  if (!orders.length) return;

  for (const order of orders) {
    // ❌ prevent duplicate processing
    if (order.payment?.status === "paid") continue;

    // ✅ mark order paid
    order.payment.status = "paid";
    order.payment.paidAt = new Date();
    order.payment.amountPaidUSD = order.totalAmountUSD;
    order.buyerStatus = "pending";

    await order.save();

    // ---------------- SELLER UPDATE ----------------
    const sellerEmail = order.sellerEmail;
    if (sellerEmail) {
      const totalItems = order.items.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
      );

      await Seller.updateOne(
        { email: sellerEmail },
        { $inc: { sales: totalItems } }
      );
    }

    // ---------------- STOCK UPDATE ----------------
    for (const item of order.items) {
      const product = await Product.findOne({ productId: item.productId });
      if (!product) continue;

      const qty = Number(item.quantity) || 1;

      // base stock
      product.stock = Math.max(0, product.stock - qty);

      // variation stock
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

      product.salesCount = (product.salesCount || 0) + qty;

      if (product.stock <= 0) {
        product.status = "Out Of Stock";
      }

      await product.save();
    }

    // ---------------- EMAILS ----------------
    try {
      await sendOrderConfirmationEmail(order);
      await sendSellerNotificationEmail(order);
    } catch (err) {
      console.error("Email error:", err.message);
    }
  }
};

/* ---------------- WEBHOOK CONTROLLER ---------------- */

// export const payfastWebhook = async (req, res) => {
//   try {
//     console.log("📩 PayFast webhook received");
    
//     const { basketId, transactionAmount, orderDate } = req.query;

    
//     const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
//     req.socket.remoteAddress || 
//     req.ip || 
//     "127.0.0.1";
    
//     const body = new URLSearchParams({
//       merchant_id: process.env.PAYFAST_MERCHANT_ID,
//       secured_key: process.env.PAYFAST_SECURED_KEY,
//       grant_type: "client_credentials",
//       customer_ip: clientIp
//     });
  
//     const response = await fetch(`${process.env.PAYFAST_API_BASE_URL}/token`, {
//       method: "POST",
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Cache-Control': 'no-cache'
//       },
//       body: body.toString(),
//     });
  
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`PayFast token request failed: ${errorText}`);
//     }
  
//     const data = await response.json();
//     const accessToken = data.token;
    
//     if (!basketId) {
//       return res.status(400).json({
//         success: false,
//         message: "Basket ID missing",
//       });
//     }


//     if (!accessToken) {
//       return res.status(500).json({
//         success: false,
//         message: "Access token not found",
//       });
//     }

//     console.log(accessToken)

//     const txnRes = await fetch(
//       `${process.env.PAYFAST_API_BASE_URL}/transaction/basket_id/${basketId}?order_date=${orderDate}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       } 
//     );
 
//     console.log(txnRes); 

//     if (!txnRes.ok) {
//       throw new Error("Failed to verify transaction");
//     }

//     const paymentData = await txnRes.json();
//     const code = paymentData?.response_code;

//     let status = "failed";

//     if (code === "00" || code === "79") {
//       status = "paid";
//     } else if (code === "001" || code === "002") {
//       status = "pending";
//     }

//     console.log("Payment status:", status);

//     if (status !== "paid") {
//       return res.status(200).json({
//         success: true,
//         status, 
//         basketId,
//         payment: paymentData,
//       });
//     }

//     await processPaidOrders(basketId);

//     console.log("✅ Orders processed successfully");

//     return res.status(200).json({
//       success: true,
//       status: "paid",
//       basketId,
//     });
//   } catch (error) {
//     console.error("❌ Webhook Error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Webhook failed",
//       error: error.message,
//     });
//   }
// };


export const payfastdirectWebhook = async (req, res) => {
  try {
    const {
      basket_id,
      transaction_id,
      err_code,
      validation_hash,
      transaction_amount,
      PaymentName
    } = req.body;

    console.log(basket_id,transaction_id,transaction_amount,err_code)
    console.log("📩 Direct webhook received:", basket_id);

    if (!basket_id) {
      return res.status(400).send("Missing basket_id");
    }

    // ---------------- HASH VALIDATION ----------------
    const calculatedHash = crypto
      .createHash("sha256")
      .update(
        `${basket_id}|${process.env.PAYFAST_SECURED_KEY}|${process.env.PAYFAST_MERCHANT_ID}|${err_code}`
      )
      .digest("hex");

      console.log(calculatedHash);

    const hashValid =
      calculatedHash.toLowerCase() === (validation_hash || "").toLowerCase();

      console.log(hashValid);

    if (!hashValid) {
      console.log("❌ Invalid hash");
      return res.status(400).send("Invalid hash");
    }

    // ---------------- PAYMENT CHECK ----------------
    if (err_code !== "000" && err_code !== "00") {
      console.log("❌ Payment not successful:", err_code);
      return res.status(200).send("NOT PAID");
    }

    // ---------------- FIND ORDERS ----------------
    const orders = await Order.find({
      "payment.paymentId": basket_id,
    });

    if (!orders.length) {
      console.log("⚠️ No orders found for basket:", basket_id);
      return res.status(200).send("NO ORDERS");
    }

    // ---------------- PROCESS ORDERS ----------------
    for (const order of orders) {
      // idempotency check
      if (order.payment?.status === "paid") {
        continue;
      }

      // mark paid
      order.payment.status = "paid";
      order.payment.paidAt = new Date();
      order.payment.transactionId = transaction_id;
      order.payment.amountPaid = transaction_amount;
      order.payment.method = PaymentName

      order.buyerStatus = "pending";

      await order.save();

      // ---------------- SELLER UPDATE ----------------
      const totalItems = order.items.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
      );

      await Seller.updateOne(
        { email: order.sellerEmail },
        { $inc: { sales: totalItems } }
      );

      // ---------------- STOCK UPDATE ----------------
      for (const item of order.items) {
        const product = await Product.findOne({ productId: item.productId });
        if (!product) continue;

        const qty = Number(item.quantity || 1);

        product.stock = Math.max(0, product.stock - qty);

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

        product.salesCount = (product.salesCount || 0) + qty;

        if (product.stock <= 0) {
          product.status = "Out Of Stock";
        }

        await product.save();
      }

      // ---------------- EMAILS ----------------
      try {
        await sendOrderConfirmationEmail(order);
        await sendSellerNotificationEmail(order);
      } catch (err) {
        console.error("Email error:", err.message);
      }
    }

    console.log("✅ Direct webhook processed successfully");

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Direct webhook error:", error);
    return res.status(500).send("FAILED");
  }
};

export const handlePaymentCallback = async (req, res) => {
  try {
    const { basketId, err_code } = req.body;

    if (!basketId || !err_code) {
      return res.status(400).json({
        success: false,
        message: "basketId and err_code are required",
      });
    }

    const successCodes = ["000", "00"];

    if (successCodes.includes(err_code)) {
      await Order.updateMany(
        { "payment.paymentId": basketId },
        {
          $set: {
            "payment.status": "paid",
            "payment.paidAt": new Date(),
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Transaction successful.",
      });
    }

    const result = await Order.deleteMany({
      "payment.paymentId": basketId,
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} order(s) deleted due to failed transaction.`,
    });
  } catch (error) {
    console.error("Payment callback error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};