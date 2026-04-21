// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import sellerRouter from "./routes/seller.js";
import "./config/passport.js";
import connectDB from "./lib/dbConnect.js";
import logoutrouter from "./routes/logouts.js";
import adminRouter from "./routes/admin.js";
import generalRouter from "./routes/generalData.js";
import paymentRouter from "./routes/paymentRoutes.js";
import exchangeRatesRouter from "./routes/exchangeratesRoute.js";
import "./jobs/payoutWorker.js";

dotenv.config();

const app = express();

app.use(cookieParser());

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// ---------------- ROUTES ----------------
app.use("/auth", authRoutes);
app.use("/seller", sellerRouter);
app.use("/logout", logoutrouter);
app.use("/admin", adminRouter);
app.use("/general", generalRouter);
app.use("/payment", paymentRouter); 
app.use("/rates", exchangeRatesRouter);

// ---------------- TEST ROUTE ----------------
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/favicon.ico", (req, res) => res.status(204));
app.get("/favicon.png", (req, res) => res.status(204));

// ---------------- START SERVER ----------------
const startServer = async () => {
  try {
    await connectDB(); // 🔥 wait for DB

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();