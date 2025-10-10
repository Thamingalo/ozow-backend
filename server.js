
import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.OZOW_INTEGRATION_MODE || "test" });
});

// Create payment
app.post("/api/payments/create", async (req, res) => {
  try {
    const {
      amount,
      email,
      firstName,
      lastName,
      reference,
      isTest = true
    } = req.body;

    const siteCode = process.env.OZOW_SITE_CODE;
    const privateKey = process.env.OZOW_PRIVATE_KEY;
    const apiKey = process.env.OZOW_API_KEY;
    const apiUrl = process.env.OZOW_API_URL || "https://api.ozow.com";
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/payments/webhook`;
    const redirectBase = process.env.REDIRECT_BASE_URL;

    const countryCode = "ZA";
    const currencyCode = "ZAR";
    const bankReference = reference.replace(/[^a-zA-Z0-9- ]/g, "").substring(0, 20);

    const cancelUrl = `${redirectBase}/api/payments/redirect/cancel`;
    const errorUrl = `${redirectBase}/api/payments/redirect/error`;
    const successUrl = `${redirectBase}/api/payments/redirect/success`;

    const amountFormatted = Number(amount).toFixed(2);

    // Hash string per Ozow spec
    const hashString = `${siteCode}${countryCode}${currencyCode}${amountFormatted}${reference}${bankReference}${cancelUrl}${errorUrl}${successUrl}${webhookUrl}${isTest}${privateKey}`;
    const hashLower = hashString.toLowerCase();
    const hash = crypto.createHash("sha512").update(hashLower).digest("hex");

    console.log("🧩 Hash String:", hashString);
    console.log("🔐 Hash Generated:", hash);

    const payload = {
      SiteCode: siteCode,
      CountryCode: countryCode,
      CurrencyCode: currencyCode,
      Amount: amountFormatted,
      TransactionReference: reference,
      BankReference: bankReference,
      CancelUrl: cancelUrl,
      ErrorUrl: errorUrl,
      SuccessUrl: successUrl,
      NotifyUrl: webhookUrl,
      IsTest: isTest,
      HashCheck: hash,
      Customer: `${firstName} ${lastName}`
    };

    const headers = {
      "ApiKey": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const response = await axios.post(`${apiUrl}/PostPaymentRequest`, payload, { headers });

    if (response.data && response.data.url) {
      return res.json({
        paymentRequestId: response.data.paymentRequestId,
        url: response.data.url,
        message: "Payment created successfully."
      });
    } else {
      return res.status(400).json({
        error: "No URL returned from Ozow",
        details: response.data
      });
    }
  } catch (error) {
    console.error("❌ Create payment error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Payment creation failed",
      details: error.response?.data || error.message
    });
  }
});

// Redirect endpoints
app.get("/api/payments/redirect/:status", (req, res) => {
  const { status } = req.params;
  res.send(`Ozow Payment ${status.toUpperCase()} — redirect successful.`);
});

// Webhook listener
app.post("/api/payments/webhook", (req, res) => {
  console.log("📩 Webhook received:", req.body);
  res.json({ received: true });
});

// Transaction status
app.get("/api/payments/status/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const apiKey = process.env.OZOW_API_KEY;
    const siteCode = process.env.OZOW_SITE_CODE;
    const apiUrl = process.env.OZOW_API_URL || "https://api.ozow.com";

    const response = await axios.get(`${apiUrl}/GetTransactionByReference`, {
      headers: {
        ApiKey: apiKey,
        Accept: "application/json"
      },
      params: {
        siteCode,
        transactionReference: reference
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Status check error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to retrieve transaction",
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => console.log(`✅ Ozow backend v5 running on port ${PORT}`));
