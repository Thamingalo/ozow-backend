import express from "express";
import crypto from "crypto";

const router = express.Router();

const {
  OZOW_SITE_CODE,
  OZOW_PRIVATE_KEY,
  OZOW_API_KEY,
  REDIRECT_BASE_URL,
  WEBHOOK_BASE_URL,
} = process.env;

// 🟢 Initiate Payment (Demo Mode)
router.post("/initiate", async (req, res) => {
  try {
    const { amount = 25.0, reference = "INV-TEST-001", isTest = true } = req.body;

    const hashString = `${OZOW_SITE_CODE}ZAZAR${amount.toFixed(2)}${reference}${reference}${REDIRECT_BASE_URL}/api/payments/redirect/cancel${REDIRECT_BASE_URL}/api/payments/redirect/error${REDIRECT_BASE_URL}/api/payments/redirect/success${WEBHOOK_BASE_URL}/api/payments/webhook${isTest}${OZOW_PRIVATE_KEY}`;

    const hashCheck = crypto.createHash("sha512").update(hashString).digest("hex");

    const payload = {
      siteCode: OZOW_SITE_CODE,
      countryCode: "ZA",
      currencyCode: "ZAR",
      amount: amount.toFixed(2),
      transactionReference: reference,
      bankReference: reference,
      cancelUrl: `${REDIRECT_BASE_URL}/api/payments/redirect/cancel`,
      errorUrl: `${REDIRECT_BASE_URL}/api/payments/redirect/error`,
      successUrl: `${REDIRECT_BASE_URL}/api/payments/redirect/success`,
      notifyUrl: `${WEBHOOK_BASE_URL}/api/payments/webhook`,
      isTest,
      hashCheck,
      apiKey: OZOW_API_KEY,
    };

    console.log("🧩 Hash String:", hashString);
    console.log("🔐 Hash Generated:", hashCheck);
    console.log("📦 Payload sent to Ozow:", payload);

    return res.json({
      status: "success",
      redirectUrl: `https://pay.ozow.com/?ref=${reference}`,
      payload,
    });
  } catch (err) {
    console.error("❌ Payment initiation error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// 🟡 Webhook Handler (Demo)
router.post("/webhook", (req, res) => {
  console.log("📬 Webhook received:", req.body);
  res.sendStatus(200);
});

// 🟣 Verify Payment (Demo)
router.post("/verify", (req, res) => {
  const { reference } = req.body;
  console.log("🔎 Verify request for:", reference);
  res.json({ status: "success", reference, verified: true });
});

export default router;
