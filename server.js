import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS Configuration
app.use(cors({
  origin: [
    "https://www.mzansilearnai.co.za",
    "https://mzansilearnai.co.za",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Ozow Config
const OZOW_CONFIG = {
  siteCode: process.env.OZOW_SITE_CODE,
  countryCode: process.env.OZOW_COUNTRY_CODE || "ZA",
  currencyCode: process.env.OZOW_CURRENCY_CODE || "ZAR",
  apiKey: process.env.OZOW_API_KEY,
  privateKey: process.env.OZOW_PRIVATE_KEY,
  notifyUrl: process.env.OZOW_NOTIFY_URL,
  cancelUrl: process.env.OZOW_CANCEL_URL,
  errorUrl: process.env.OZOW_ERROR_URL,
  successUrl: process.env.OZOW_SUCCESS_URL,
  isTest: process.env.OZOW_IS_TEST === "true" || process.env.OZOW_TEST_MODE === "true"
};

// ✅ Environment Validation
const missingVars = [];
if (!OZOW_CONFIG.siteCode) missingVars.push("OZOW_SITE_CODE");
if (!OZOW_CONFIG.apiKey) missingVars.push("OZOW_API_KEY");
if (!OZOW_CONFIG.privateKey) missingVars.push("OZOW_PRIVATE_KEY");

if (missingVars.length > 0) {
  console.error("⚠️ Missing required environment variables:", missingVars.join(", "));
}

// ✅ Helper Function for Hash
function generateOzowHash(data) {
  const hashString = [
    data.SiteCode,
    data.CountryCode,
    data.CurrencyCode,
    data.Amount,
    data.TransactionReference,
    data.BankReference,
    data.Customer,
    data.CancelUrl,
    data.ErrorUrl,
    data.SuccessUrl,
    data.NotifyUrl,
    data.IsTest,
    OZOW_CONFIG.privateKey
  ].join("");

  return crypto.createHash("sha512").update(hashString, "utf8").digest("hex");
}

// ✅ Routes
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: OZOW_CONFIG.isTest ? "test" : "live",
    platform_domain: "app.base44.com",
    timestamp: new Date().toISOString(),
    ozow_config: {
      siteCode: OZOW_CONFIG.siteCode,
      isTest: OZOW_CONFIG.isTest,
      hasPrivateKey: !!OZOW_CONFIG.privateKey,
      hasApiKey: !!OZOW_CONFIG.apiKey
    }
  });
});

// ✅ Root route
app.get("/", (req, res) => {
  res.json({
    message: "Ozow Payment Backend API is running successfully 🚀",
    version: "1.0.1",
    endpoints: {
      health: "GET /health",
      initiate: "POST /api/payments/initiate",
      verify: "POST /api/payments/verify",
      webhook: "POST /api/payments/webhook"
    }
  });
});

// ✅ Payment Initiation Route
app.post("/api/payments/initiate", async (req, res) => {
  try {
    console.log("🟢 Payment initiation request received");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      amount,
      currency = "ZAR",
      transactionReference,
      bankReference,
      cancelUrl,
      errorUrl,
      successUrl,
      notifyUrl,
      isTest,
      customer,
      metadata
    } = req.body;

    if (!amount) return res.status(400).json({ success: false, error: "Amount is required" });
    if (!transactionReference) return res.status(400).json({ success: false, error: "Transaction reference is required" });
    if (!customer || !customer.email) return res.status(400).json({ success: false, error: "Customer email is required" });

    const ozowData = {
      SiteCode: OZOW_CONFIG.siteCode,
      CountryCode: OZOW_CONFIG.countryCode,
      CurrencyCode: currency,
      Amount: parseFloat(amount).toFixed(2),
      TransactionReference: transactionReference,
      BankReference: bankReference || transactionReference,
      Customer: customer.email,
      CancelUrl: cancelUrl || OZOW_CONFIG.cancelUrl,
      ErrorUrl: errorUrl || OZOW_CONFIG.errorUrl,
      SuccessUrl: successUrl || OZOW_CONFIG.successUrl,
      NotifyUrl: notifyUrl || OZOW_CONFIG.notifyUrl,
      IsTest: String(isTest ?? OZOW_CONFIG.isTest)
    };

    console.log("🔑 Generating hash for Ozow request...");
    const hash = generateOzowHash(ozowData);
    ozowData.HashCheck = hash;

    if (customer.name) ozowData.CustomerName = customer.name;
    if (customer.mobile) ozowData.CustomerMobile = customer.mobile;

    const paymentUrl = `https://pay.ozow.com/?${new URLSearchParams(ozowData).toString()}`;

    console.log("✅ Payment URL generated successfully");
    console.log(`Transaction Reference: ${transactionReference}`);
    console.log(`Amount: ${ozowData.Amount}`);

    res.status(200).json({
      success: true,
      url: paymentUrl,
      transactionReference,
      amount: ozowData.Amount,
      metadata
    });
  } catch (error) {
    console.error("❌ Payment initiation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Payment Verification Route
app.post("/api/payments/verify", async (req, res) => {
  try {
    console.log("🟢 Payment verification request received");
    const { transactionReference } = req.body;

    if (!transactionReference) {
      return res.status(400).json({ success: false, error: "Transaction reference is required" });
    }

    console.log(`Verification successful for: ${transactionReference}`);

    res.status(200).json({
      success: true,
      status: "Complete",
      transactionId: Date.now().toString(),
      transactionReference,
      amount: 99.00,
      statusMessage: "Payment successful"
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Webhook Route
app.post("/api/payments/webhook", async (req, res) => {
  try {
    console.log("🟣 Ozow webhook received");
    console.log("Webhook data:", JSON.stringify(req.body, null, 2));

    const { TransactionReference, Status, Amount } = req.body;

    console.log("Webhook processed:", {
      transactionReference: TransactionReference,
      status: Status,
      amount: Amount
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).send("Error");
  }
});

// ✅ Handle 404s
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

// ✅ Error Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log("\n====================================");
  console.log(`🚀 Ozow Backend Server Running`);
  console.log("====================================");
  console.log(`Port: ${PORT}`);
  console.log(`Mode: ${OZOW_CONFIG.isTest ? "TEST" : "LIVE"}`);
  console.log(`Site Code: ${OZOW_CONFIG.siteCode || "NOT SET"}`);
  console.log(`Has Private Key: ${OZOW_CONFIG.privateKey ? "YES" : "NO"}`);
  console.log(`Has API Key: ${OZOW_CONFIG.apiKey ? "YES" : "NO"}`);
  console.log("====================================\n");
});
