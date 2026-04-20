import ExchangeRate from "../models/exchangeRates.js";

// Get exchange rates (create first doc if not exists)
export const getExchangeRates = async (req, res) => {
  try {
    let exchange = await ExchangeRate.findOne({ baseCurrency: "USD" });

    if (!exchange) {
      exchange = await ExchangeRate.create({
        baseCurrency: "USD",
        rates: {}, // empty rates initially
      });
    }

    const ratesObj = Object.fromEntries(exchange.rates);

    res.status(200).json({
      baseCurrency: exchange.baseCurrency,
      rates: ratesObj,
      lastUpdated: exchange.lastUpdated,
    });
  } catch (err) {
    console.error("Get exchange rates error:", err);
    res.status(500).json({
      message: "Failed to get exchange rates",
      error: err.message,
    });
  }
};

// Update exchange rates
export const updateExchangeRates = async (req, res) => {
  try {
    const { rates } = req.body; // Expected format: { PKR: 285 } or { INR: 84 }

    // 1. Validation
    if (!rates || typeof rates !== "object") {
      return res.status(400).json({ 
        success: false,
        message: "A valid rates object is required (e.g., { PKR: 285 })" 
      });
    }

    // 2. Find the existing document (Base is always USD for Tradexon)
    let exchange = await ExchangeRate.findOne({ baseCurrency: "USD" });

    if (!exchange) {
      // 3a. Create new document if it doesn't exist
      exchange = await ExchangeRate.create({
        baseCurrency: "USD",
        rates: rates,
      });
    } else {
      // 3b. THE FIX: Iterate through the incoming rates and update the Map
      // This ensures if you send PKR, the INR/AED rates stay safe in the DB
      Object.entries(rates).forEach(([currency, value]) => {
        // .set() is a Map method that adds or updates a specific key
        exchange.rates.set(currency.toUpperCase(), parseFloat(value));
      });

      exchange.lastUpdated = new Date();
      await exchange.save();
    }

    // 4. Return the full updated list to the frontend
    // We convert the Map back to an Object so the frontend can read it easily
    res.status(200).json({
      success: true,
      message: "Exchange rates synchronized successfully",
      baseCurrency: exchange.baseCurrency,
      rates: Object.fromEntries(exchange.rates),
      lastUpdated: exchange.lastUpdated,
    });

  } catch (err) {
    console.error("CRITICAL_UPDATE_ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server failed to update exchange rates",
      error: err.message,
    });
  }
};