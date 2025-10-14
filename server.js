import express from "express";
import crypto from "crypto";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// Environment variables
const siteCode = process.env.OZOW_SITE_CODE;
const countryCode = process.env.OZOW_COUNTRY_CODE;
const currencyCode = process.env.OZOW_CURRENCY_CODE;
const privateKey = process.env.OZOW_PRIVATE_KEY;
const apiKey = process.env.OZOW_API_KEY;
const apiUrl = process.env.OZOW_API_URL;

app.post("/api/payments/create", async (req, res) => {
  try {
    const {
      Amount = "25.00",
      TransactionReference = "INV-TEST-001",
      BankReference = "INV-TEST-001",
    } = req.body;

    const CancelUrl = "https://www.mzansilearnai.co.za/api/payments/redirect/cancel";
    const ErrorUrl = "https://www.mzansilearnai.co.za/api/payments/redirect/error";
    const SuccessUrl = "https://www.mzansilearnai.co.za/api/payments/redirect/success";
    const NotifyUrl = "https://ozow-backend.onrender.com/api/payments/webhook";
    const IsTest = "true";

    const dataString = `${siteCode}${countryCode}${currencyCode}${Amount}${TransactionReference}${BankReference}${CancelUrl}${ErrorUrl}${SuccessUrl}${NotifyUrl}${IsTest}${privateKey}`;
    const hash = crypto.createHash("sha512").update(dataString, "utf8").digest("hex").toUpperCase();

    const payload = new URLSearchParams({
      SiteCode: siteCode,
      CountryCode: countryCode,
      CurrencyCode: currencyCode,
      Amount,
      TransactionReference,
      BankReference,
      CancelUrl,
      ErrorUrl,
      SuccessUrl,
      NotifyUrl,
      IsTest,
      HashCheck: hash,
      ApiKey: apiKey,
    });

    console.log("📦 Sending Payload:", Object.fromEntries(payload));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });

    const result = await response.text();
    console.log("💳 Ozow Response:", result);
    res.send(result);
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment request." });
  }
});

app.listen(PORT, () => console.log(`🧠 Ozow test backend running on port ${PORT}`));
