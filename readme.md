# 🚀 Ecommerce Backend (TradeXon)

Welcome to the backend engine powering **TradeXon Marketplace** 🛒 — a scalable, multi-vendor ecommerce platform built with modern technologies.

---

## 🌐 Overview

This backend is responsible for handling:

✨ User, Seller & Admin Authentication  
🛍️ Product & Marketplace Data  
📦 Orders & Seller Management  
💳 Payments & Invoices  
☁️ Image Uploads (Cloudinary)  
📊 Exchange Rates  
📨 Contact & Support System  
⚙️ Background Jobs (Payouts, etc.)

---

## 🧰 Tech Stack

- 🟢 Node.js
- ⚡ Express.js
- 🍃 MongoDB + Mongoose
- 🔐 JWT Authentication
- 🌍 Passport Google OAuth
- ☁️ Cloudinary (image storage)
- 📂 Multer (file uploads)
- 🍪 Cookie Parser
- 🔄 CORS
- 🔒 dotenv
- 📧 Nodemailer
- ⏱️ node-cron
- 💰 Safepay SDK

---

## 📁 Project Structure

```
config/        → Third-party configs (OAuth, Cloudinary, Safepay)
controllers/   → Business logic
jobs/          → Background workers (payouts, etc.)
lib/           → Utilities (DB connection)
middlewares/   → Auth & request middlewares
models/        → Mongoose schemas
routes/        → API route definitions
server.js      → Entry point
```

---

## ✨ Features

### 🔐 Authentication
- OTP-based signup & verification
- Email/password login
- Google OAuth login
- Separate auth for:
  - 👤 Users
  - 🏪 Sellers
  - 🛡️ Admins

### 🛍️ Marketplace
- Featured, trending, best seller & new arrival products
- Product search & filtering
- Category-based products
- Seller storefront data

### 📦 Orders
- User order history
- Seller order management
- Status updates

### 💳 Payments
- Invoice creation via Safepay
- Webhook handling for payment confirmation

### ☁️ Media
- Upload & delete images via Cloudinary

### 📊 Utilities
- Exchange rate management
- Contact form API
- Seller support messaging

---

## 🔌 API Routes Overview

### 🔑 `/auth`
Handles all authentication flows.

### 🏪 `/seller`
Seller dashboard, products, orders & support.

### 🛡️ `/admin`
Admin-only operations.

### 🌍 `/general`
Public marketplace data (homepage, categories, products).

### 💳 `/payment`
Invoice creation & Safepay webhook.

### 💱 `/rates`
Currency exchange rates.

### 🚪 `/logout`
Logout routes for seller/admin.

---

## ⚙️ Installation

```bash
git clone https://github.com/muhammad-aman-dev/Ecommerce-Backend.git
cd Ecommerce-Backend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

SAFEPAY_API_KEY=your_key
```

---

## ▶️ Running the Server

### Development Mode

```bash
npm run dev
```

Server runs with **nodemon** 🔁

---

## 🧠 Important Notes

- 📌 MongoDB connection is handled in `lib/dbConnect.js`
- 🔐 JWT auth is cookie-based
- 🌍 Google OAuth configured in `config/passport.js`
- ☁️ Cloudinary setup in `config/cloudinary.js`
- 💳 Safepay configured for sandbox testing

---

## 📌 Future Improvements

- 🧾 Order invoice PDFs
- 📊 Advanced analytics dashboard
- 🔔 Notification system
- 🌍 Multi-language support

---

## 📜 License

⚠️ No license file found. Consider adding one if this project is public.

---

## 💡 Author

Built with ❤️ by **Muhammad Aman**

---

### ⭐ If you like this project, give it a star on GitHub!

