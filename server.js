// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration — allow Base44 + production domains
app.use(
  cors({
    origin: [
      "https://www.mzansilearnai.co.za", // Production
      "https://mzansi-learn-70007047.base44.app", // Base44 staging
      "https://mzansilearnai.app", // Optional app domain
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Environment Variables
const PORT = process.env.PORT || 10000;
const MODE = process.env.NODE_ENV === "production" ? "LIVE" : "TEST";
const SITE_CODE = process.env.OZOW_SITE_CODE || "TSTSTE0001";
const PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || "demo-private-key";
const API_KEY = process.env.OZOW_API_KEY || "demo-api-key";
const IS_TEST = process.env.OZOW_IS_TEST === "true";
const BASE_URL = process.env.OZOW_API_URL || "https://pay.ozow.com";

// ✅ Health Check
app.get("/health", (req, res) => {
  res.json({
    message: "✅ Ozow Secure Backend running",
    mode: MODE,
    siteCode: SITE_CODE,
    status: "active",
    time: new Date().toISOString(),
  });
});

// ✅ Hash Generator (utility)
app.post("/api/payments/generate-hash", (req, res) => {
  try {
    const { dataString } = req.body;
    if (!dataString)
      return res.status(400).json({ success: false, message: "Missing dataString" });

    const hash = crypto
      .createHash("sha512")
      .update(dataString + PRIVATE_KEY)
      .digest("hex");

    res.json({ success: true, hash });
  } catch (error) {
    console.error("❌ Hash generation failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Initiate Payment (LIVE + TEST READY)
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

    // ✅ URLs
    const successUrl = process.env.OZOW_SUCCESS_URL;
    const cancelUrl = process.env.OZOW_CANCEL_URL;
    const errorUrl = process.env.OZOW_ERROR_URL;
    const notifyUrl = process.env.OZOW_NOTIFY_URL;

    // ✅ Build Ozow data string for hash
    const dataString = `${SITE_CODE}${IS_TEST}${reference}${amount}${process.env.OZOW_CURRENCY_CODE}${process.env.OZOW_COUNTRY_CODE}${successUrl}${errorUrl}${cancelUrl}${notifyUrl}`;
    const hash = crypto.createHash("sha512").update(dataString + PRIVATE_KEY).digest("hex");

    // ✅ Build redirect URL
    const redirectUrl = `${BASE_URL}/?SiteCode=${SITE_CODE}&CountryCode=${process.env.OZOW_COUNTRY_CODE}&CurrencyCode=${process.env.OZOW_CURRENCY_CODE}&Amount=${amount}&TransactionReference=${reference}&BankReference=${reference}&IsTest=${IS_TEST}&HashCheck=${hash}&SuccessUrl=${encodeURIComponent(
      successUrl
    )}&ErrorUrl=${encodeURIComponent(errorUrl)}&CancelUrl=${encodeURIComponent(
      cancelUrl
    )}&NotifyUrl=${encodeURIComponent(
      notifyUrl
    )}${
      customerName
        ? `&Customer={Name:${customerName},Email:${customerEmail || ""}}`
        : ""
    }`;

    console.log("✅ Redirect URL generated:", redirectUrl);

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      amount,
      reference,
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

// ✅ Webhook for Ozow
app.post("/api/payments/webhook", (req, res) => {
  console.log("🟣 Ozow webhook received");
  console.log("Webhook data:", req.body);

  try {
    const {
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      Hash,
    } = req.body;

    // ✅ Build data string for validation
    const dataString = `${SiteCode}${TransactionId}${TransactionReference}${Amount}${Status}`;
    const computedHash = crypto
      .createHash("sha512")
      .update(dataString + PRIVATE_KEY)
      .digest("hex");

    if (MODE === "LIVE" && computedHash !== Hash) {
      console.warn("⚠️ Invalid webhook hash. Possible tampering detected.");
      return res.status(400).json({ success: false, message: "Invalid hash" });
    } else if (MODE === "TEST") {
      console.log("✅ TEST MODE: Skipping hash validation.");
    }

    console.log("✅ Webhook processed:", {
      transactionReference: TransactionReference,
      status: Status,
      amount: Amount,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log("🚀 Ozow Backend Server Running");
  console.log("====================================");
  console.log(`Port: ${PORT}`);
  console.log(`Mode: ${MODE}`);
  console.log(`Site Code: ${SITE_CODE}`);
  console.log(`Has Private Key: ${PRIVATE_KEY ? "YES" : "NO"}`);
  console.log(`Has API Key: ${API_KEY ? "YES" : "NO"}`);
  console.log("====================================");
});
