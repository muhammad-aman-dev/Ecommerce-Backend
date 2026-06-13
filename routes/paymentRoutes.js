import express from "express";
import {
  createInvoice,
  payfastWebhook,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-invoice", createInvoice);

paymentRouter.get("/webhook/payfast", payfastWebhook);

export default paymentRouter;