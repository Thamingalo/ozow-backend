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

// ✅ CORS — allow all your frontends
app.use(cors({
  origin: [
    "https://www.mzansilearnai.co.za",          // Production
    "https://mzansi-learn-70007047.base44.app", // Base44 staging
    "https://mzansilearnai.app"                 // Optional app domain
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ✅ Extra fallback CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ✅ Environment Variables
const PORT = process.env.PORT || 10000;
const MODE = process.env.MODE || "LIVE"; // Switch from TEST to LIVE
const SITE_CODE = process.env.SITE_CODE || "MOK-MOK-007";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "d721541c3322432b8294e92c8e75cd32";
const API_KEY = process.env.API_KEY || "7b7f3cf189df446f9039dfd81d4fd84e";

// ✅ 1. Health Check
app.get("/", (req, res) => {
  res.json({
    message: "✅ Ozow Secure Backend running",
    mode: MODE,
    site: SITE_CODE,
    status: "active",
  });
});

// ✅ 2. Hash Generator
app.post("/api/payments/generate-hash", (req, res) => {
  try {
    const { dataString } = req.body;
    if (!dataString) {
      return res.status(400).json({ success: false, message: "Missing dataString" });
    }

    const hash = crypto.createHash("sha512").update(dataString + PRIVATE_KEY).digest("hex");
    res.json({ success: true, hash });
  } catch (error) {
    console.error("❌ Hash generation failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ 3. Payment Initiation
app.post("/api/payments/initiate", async (req, res) => {
  console.log("POST /api/payments/initiate hit ✅");
  console.log("Payload:", req.body);

  const { amount, transactionReference, customer } = req.body;
  if (!amount || !transactionReference) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // ✅ Simulated Ozow initiation response
    const redirectUrl = `https://pay.ozow.com/${transactionReference}`;
    return res.status(200).json({
      success: true,
      message: `Payment initiation successful (${MODE} MODE)`,
      siteCode: SITE_CODE,
      transactionReference,
      amount,
      customer,
      redirectUrl,
    });
  } catch (error) {
    console.error("❌ Initiation failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ 4. Webhook Endpoint
app.post("/api/payments/webhook", (req, res) => {
  console.log("🟣 Ozow webhook received");
  console.log("Webhook data:", req.body);

  try {
    const { SiteCode, TransactionId, TransactionReference, Amount, Status, Hash } = req.body;
    const dataString = `${SiteCode}${TransactionId}${TransactionReference}${Amount}${Status}`;
    const computedHash = crypto.createHash("sha512").update(dataString + PRIVATE_KEY).digest("hex");

    if (MODE === "LIVE" && computedHash !== Hash) {
      console.warn("⚠️ Invalid webhook hash. Possible tampering detected.");
      return res.status(400).json({ success: false, message: "Invalid hash" });
    } else if (MODE === "TEST") {
      console.log("✅ TEST MODE: Skipping hash validation.");
    }

    console.log("Webhook processed:", {
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

// ✅ Keep Render service warm (optional ping)
app.get("/api/ping", (_, res) => res.send("pong"));

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
