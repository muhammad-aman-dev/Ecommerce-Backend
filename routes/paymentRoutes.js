import express from "express";
import {
  createInvoice,
  payfastdirectWebhook,
  handlePaymentCallback
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-invoice", createInvoice);

// paymentRouter.get("/webhook/payfast", payfastWebhook);
paymentRouter.get("/webhook/payfast-direct", payfastdirectWebhook);
paymentRouter.post("/webhook/payfast-direct", payfastdirectWebhook);
paymentRouter.post("/webhook/payfast-checkcode", handlePaymentCallback);

export default paymentRouter;