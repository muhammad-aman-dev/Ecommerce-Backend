import express from "express";
import {
  createInvoice,
  safepayWebhook,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-invoice", createInvoice);

paymentRouter.post("/webhook/safepay", safepayWebhook);

export default paymentRouter;