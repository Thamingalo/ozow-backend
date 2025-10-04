import express from "express";
import axios from "axios";
import qs from "qs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const {
  OZOW_CLIENT_ID,
  OZOW_CLIENT_SECRET,
  OZOW_ENV,
  PORT
} = process.env;

const AUTH_URL = `${OZOW_ENV}/auth/connect/token`;
const PAYMENT_URL = `${OZOW_ENV}/payments`;

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

app.post("/api/payments/create", async (req, res) => {
  try {
    const token = await getAccessToken();

    const { amount, email, firstName, lastName, reference } = req.body;

    const payload = {
      amount,
      currencyCode: "ZAR",
      transactionReference: reference || `INV-${Date.now()}`,
      customer: {
        firstName,
        lastName,
        email
      },
      redirectUrls: {
        successUrl: "https://www.mzansilearnai.co.za/payment-success",
        cancelUrl: "https://www.mzansilearnai.co.za/payment-cancel",
        errorUrl: "https://www.mzansilearnai.co.za/payment-error"
      },
      notificationUrl: "https://www.mzansilearnai.co.za/payment-webhook"
    };

    const response = await axios.post(PAYMENT_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uuidv4()
      }
    });

    res.json({ paymentUrl: response.data.url });
  } catch (error) {
    console.error("Ozow Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
});

app.post("/api/payments/webhook", (req, res) => {
  console.log("Ozow Webhook Data:", req.body);
  res.sendStatus(200);
});

app.get("/payment-success", (req, res) => res.send("✅ Payment Successful!"));
app.get("/payment-cancel", (req, res) => res.send("❌ Payment Cancelled!"));
app.get("/payment-error", (req, res) => res.send("⚠️ Payment Error!"));

app.listen(PORT || 3000, () => {
  console.log(`✅ Server running securely on port ${PORT || 3000}`);
});
