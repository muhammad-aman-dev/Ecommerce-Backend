import express from "express";
import { getExchangeRates, updateExchangeRates } from "../controllers/exchangeRatesController.js";
import { adminAuth } from "../middlewares/adminMiddleware.js";

const exchangeRatesRouter = express.Router();

exchangeRatesRouter.get("/get-rates", getExchangeRates);
exchangeRatesRouter.post("/update-rates", adminAuth, updateExchangeRates);


export default exchangeRatesRouter;