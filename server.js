// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ================== ENV CONFIG ===================
const PORT = process.env.PORT || 10000;
const OZOW_MODE = process.env.OZOW_MODE || "LIVE";
const SITE_CODE = process.env.OZOW_SITE_CODE || "MOK-MOK-007";
const PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || "d721541c3322432b8294e92c8e75cd32";
const API_KEY = process.env.OZOW_API_KEY || "7b7f3cf189df446f9039dfd81d4fd84e";

const SUCCESS_URL = process.env.OZOW_SUCCESS_URL || "https://www.mzansilearnai.co.za/api/payments/redirect/success";
const ERROR_URL = process.env.OZOW_ERROR_URL || "https://www.mzansilearnai.co.za/api/payments/redirect/error";
const CANCEL_URL = process.env.OZOW_CANCEL_URL || "https://www.mzansilearnai.co.za/api/payments/redirect/cancel";
const NOTIFY_URL = process.env.OZOW_NOTIFY_URL || "https://ozow-backend.onrender.com/api/payments/webhook";

const IS_TEST = OZOW_MODE === "TEST";
const BASE_URL = IS_TEST ? "https://test.ozow.com" : "https://pay.ozow.com";
const CURRENCY = "ZAR";
const COUNTRY = "ZA";

// ================== LOG STARTUP ===================
console.log("🚀 Ozow Backend Server Running");
console.log("====================================");
console.log(`Port: ${PORT}`);
console.log(`Mode: ${OZOW_MODE}`);
console.log(`Site Code: ${SITE_CODE}`);
console.log(`Has Private Key: ${PRIVATE_KEY ? "YES" : "NO"}`);
console.log(`Has API Key: ${API_KEY ? "YES" : "NO"}`);
console.log("====================================");

// ================== HEALTH CHECK ===================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Ozow backend running fine ✅" });
});

// ================== PAYMENT INITIATE ===================
app.post("/api/payments/initiate", (req, res) => {
  console.log("POST /api/payments/initiate hit ✅");
  console.log("Payload:", req.body);

  try {
    const { amount, reference, customerName, customerEmail } = req.body;

    if (!amount || !reference) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount or reference",
      });
    }

    // Ensure BankReference ≤ 20 chars using hash method
    const bankReference = crypto
      .createHash("sha256")
      .update(reference)
      .digest("hex")
      .slice(0, 20);

    // Build Ozow data string for HashCheck (exact field order required)
    const dataString =
      SITE_CODE +
      IS_TEST +
      reference +
      amount +
      CURRENCY +
      COUNTRY +
      SUCCESS_URL +
      ERROR_URL +
      CANCEL_URL +
      NOTIFY_URL;

    const hashCheck = crypto
      .createHash("sha512")
      .update(dataString + PRIVATE_KEY)
      .digest("hex");

    const redirectUrl = `${BASE_URL}/?SiteCode=${encodeURIComponent(
      SITE_CODE
    )}&CountryCode=${encodeURIComponent(COUNTRY)}&CurrencyCode=${encodeURIComponent(
      CURRENCY
    )}&Amount=${encodeURIComponent(amount)}&TransactionReference=${encodeURIComponent(
      reference
    )}&BankReference=${encodeURIComponent(
      bankReference
    )}&IsTest=${IS_TEST}&HashCheck=${encodeURIComponent(
      hashCheck
    )}&SuccessUrl=${encodeURIComponent(SUCCESS_URL)}&ErrorUrl=${encodeURIComponent(
      ERROR_URL
    )}&CancelUrl=${encodeURIComponent(CANCEL_URL)}&NotifyUrl=${encodeURIComponent(
      NOTIFY_URL
    )}${customerName ? `&Customer={Name:${encodeURIComponent(customerName)},Email:${encodeURIComponent(customerEmail || "")}}` : ""}`;

    console.log("✅ Redirect URL generated:", redirectUrl);
    console.log("✅ BankReference used:", bankReference);

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      amount,
      reference,
      bankReference,
      redirectUrl,
    });
  } catch (err) {
    console.error("❌ Payment initiation failed:", err);
    res.status(500).json({
      success: false,
      message: "Server error during payment initiation",
    });
  }
});

// ================== WEBHOOK ENDPOINT ===================
app.post("/api/payments/webhook", (req, res) => {
  console.log("🔔 Ozow Webhook Received");
  console.log("Body:", req.body);
  // You can handle payment confirmation logic here (DB update, email, etc.)
  res.status(200).send("Webhook received successfully ✅");
});

// ================== START SERVER ===================
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
