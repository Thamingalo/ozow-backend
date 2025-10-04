import express from "express";
import axios from "axios";
import qs from "qs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OZOW_CLIENT_ID = process.env.OZOW_CLIENT_ID;
const OZOW_CLIENT_SECRET = process.env.OZOW_CLIENT_SECRET;
const OZOW_ENV = process.env.OZOW_ENV || "https://stagingone.ozow.com";
const REDIRECT_BASE = process.env.REDIRECT_BASE_URL || "https://www.mzansilearnai.co.za";
const WEBHOOK_BASE = process.env.WEBHOOK_BASE_URL || `https://ozow-backend.onrender.com`;

// Allow requests only from your frontend domain
app.use(cors({ origin: REDIRECT_BASE }));

const AUTH_URL = `${OZOW_ENV}/auth/connect/token`;
const PAYMENT_URL = `${OZOW_ENV}/payments`;

// Get OAuth2 token
async function getAccessToken() {
  const response = await axios.post(
    AUTH_URL,
    qs.stringify({
      grant_type: "client_credentials",
      scope: "payment"
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: {
        username: OZOW_CLIENT_ID,
        password: OZOW_CLIENT_SECRET
      }
    }
  );
  return response.data.access_token;
}

// Create a payment
app.post("/api/payments/create", async (req, res) => {
  try {
    const token = await getAccessToken();

    const { amount, email, firstName, lastName, reference } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing required fields: amount, email" });
    }

    const payload = {
      amount,
      currencyCode: "ZAR",
      transactionReference: reference || `INV-${Date.now()}`,
      customer: {
        firstName: firstName || "Learner",
        lastName: lastName || "Mzansi",
        email
      },
      redirectUrls: {
        successUrl: `${REDIRECT_BASE}/payment-success`,
        cancelUrl: `${REDIRECT_BASE}/payment-cancel`,
        errorUrl: `${REDIRECT_BASE}/payment-error`
      },
      notificationUrl: `${WEBHOOK_BASE}/api/payments/webhook`
    };

    const response = await axios.post(PAYMENT_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uuidv4()
      }
    });

    // Return payment URL (response shape may vary)
    const paymentUrl = response.data.url || response.data.checkoutUrl || response.data.paymentUrl || response.data;
    res.json({ paymentUrl });
  } catch (error) {
    console.error("Ozow Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment creation failed", details: error.response?.data || error.message });
  }
});

// Webhook: Ozow will POST here
app.post("/api/payments/webhook", (req, res) => {
  console.log("=== Ozow Webhook Received ===");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  // For testing we only log. Implement verification & persistence for production.
  res.sendStatus(200);
});

app.get("/payment-success", (req, res) => res.send("✅ Payment Successful!"));
app.get("/payment-cancel", (req, res) => res.send("❌ Payment Cancelled!"));
app.get("/payment-error", (req, res) => res.send("⚠️ Payment Error!"));

app.get("/health", (req, res) => res.send({ status: "ok", env: process.env.NODE_ENV || "staging" }));

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`➡️ Redirect base: ${REDIRECT_BASE}`);
  console.log(`➡️ Webhook base: ${WEBHOOK_BASE}`);
});
