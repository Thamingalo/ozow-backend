// server.js
import express from "express";
import crypto from "crypto";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// === Ozow Config (Test Environment) ===
const SiteCode = "TSTSTE0001";
const CountryCode = "ZA";
const CurrencyCode = "ZAR";
const PrivateKey = "215114531AFF7134A94C88CEEA48E"; // your test private key
const ApiKey = "EB5758F2C3B4DF3FF4F2669D5FF5B";   // your test API key
const IsTest = true;

// === Redirect URLs ===
const CancelUrl = "https://www.mzansilearnai.co.za/api/payments/redirect/cancel";
const ErrorUrl = "https://www.mzansilearnai.co.za/api/payments/redirect/error";
const SuccessUrl = "https://www.mzansilearnai.co.za/api/payments/redirect/success";
const NotifyUrl = "https://ozow-backend.onrender.com/api/payments/webhook";

// === Generate Ozow Payment Request ===
app.post("/api/payments/initiate", async (req, res) => {
  try {
    // 1️⃣ Pull amount and reference from client request
    const { amount, reference } = req.body;

    // Validate input
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a valid number" });
    }

    const Amount = parseFloat(amount).toFixed(2); // format to two decimals
    const TransactionReference = reference || `INV-${Date.now()}`;
    const BankReference = TransactionReference;

    // 2️⃣ Build the Ozow hash string (must match Ozow field order)
    const hashString = `${SiteCode}${CountryCode}${CurrencyCode}${Amount}${TransactionReference}${BankReference}${CancelUrl}${ErrorUrl}${SuccessUrl}${NotifyUrl}${IsTest}${PrivateKey}`;
    console.log("🧩 Hash String:", hashString);

    // 3️⃣ Generate SHA512 hash
    const HashCheck = crypto.createHash("sha512").update(hashString, "utf8").digest("hex");
    console.log("🔐 Hash Generated:", HashCheck);

    // 4️⃣ Build payload
    const payload = {
      SiteCode,
      CountryCode,
      CurrencyCode,
      Amount,
      TransactionReference,
      BankReference,
      CancelUrl,
      ErrorUrl,
      SuccessUrl,
      NotifyUrl,
      IsTest,
      HashCheck,
    };

    console.log("📦 Payload sent to Ozow:", payload);

    // 5️⃣ Send request to Ozow
    const ozowResponse = await axios.post("https://api.ozow.com/v3/transactions", payload, {
      headers: {
        "apiKey": ApiKey,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Ozow Response:", ozowResponse.data);
    res.json(ozowResponse.data);

  } catch (error) {
    console.error("💳 Ozow Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// === Webhook endpoint (NotifyUrl) ===
app.post("/api/payments/webhook", (req, res) => {
  console.log("📥 Webhook received:", req.body);
  res.sendStatus(200);
});

// === Server Startup ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Ozow backend v5.3 running on port ${PORT}`));
