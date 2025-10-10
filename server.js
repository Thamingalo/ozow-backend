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
const REDIRECT_BASE = process.env.REDIRECT_BASE_URL || "https://www.mzansilearnai.co.za";
const WEBHOOK_BASE = process.env.WEBHOOK_BASE_URL || "https://ozow-backend.onrender.com";
const MODE = (process.env.OZOW_INTEGRATION_MODE || "legacy").toLowerCase();

// Legacy credentials
const SITE_CODE = process.env.OZOW_SITE_CODE;
const PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY;
const API_KEY = process.env.OZOW_API_KEY;
const OZOW_PAYMENT_URL = process.env.OZOW_PAYMENT_URL || "https://pay.ozow.com";
const OZOW_API_URL = process.env.OZOW_API_URL || "https://api.ozow.com";

// OneAPI credentials (future use)
const ONEAPI_ENV = process.env.OZOW_ONEAPI_ENV || "https://stagingone.ozow.com";
const CLIENT_ID = process.env.OZOW_CLIENT_ID;
const CLIENT_SECRET = process.env.OZOW_CLIENT_SECRET;

app.use(cors({ origin: REDIRECT_BASE }));

function sha512HexLower(s) {
  return crypto.createHash("sha512").update(s.toLowerCase()).digest("hex");
}
function normalizeHash(h) {
  if (!h) return "";
  return h.replace(/^0+/, "").toLowerCase();
}
function buildPostHashString(postObj) {
  const arr = [
    postObj.SiteCode || "",
    postObj.CountryCode || "",
    postObj.CurrencyCode || "",
    (typeof postObj.Amount !== "undefined" ? Number(postObj.Amount).toFixed(2) : ""),
    postObj.TransactionReference || "",
    postObj.BankReference || "",
    postObj.CancelUrl || "",
    postObj.ErrorUrl || "",
    postObj.SuccessUrl || "",
    postObj.NotifyUrl || "",
    (typeof postObj.IsTest !== "undefined" ? String(postObj.IsTest) : ""),
    postObj.Optional1 || "",
    postObj.Optional2 || "",
    postObj.Optional3 || "",
    postObj.Optional4 || "",
    postObj.Optional5 || "",
    postObj.Customer || ""
  ];
  const concatString = arr.join("") + (PRIVATE_KEY || "");
  console.log("🧩 Ozow Hash String:", concatString);
  console.log("🔐 Generated Hash:", sha512HexLower(concatString));
  return concatString;
}
function generatePostHash(postObj) {
  return sha512HexLower(buildPostHashString(postObj));
}
function buildResponseHashString(responseObj) {
  const arr = [
    responseObj.SiteCode || "",
    responseObj.TransactionId || "",
    responseObj.TransactionReference || "",
    (typeof responseObj.Amount !== "undefined" ? Number(responseObj.Amount).toFixed(2) : ""),
    responseObj.Status || "",
    responseObj.Optional1 || "",
    responseObj.Optional2 || "",
    responseObj.Optional3 || "",
    responseObj.Optional4 || "",
    responseObj.Optional5 || "",
    responseObj.CurrencyCode || "",
    (typeof responseObj.IsTest !== "undefined" ? String(responseObj.IsTest) : ""),
    responseObj.StatusMessage || ""
  ];
  return arr.join("") + (PRIVATE_KEY || "");
}
function validateResponseHash(responseObj) {
  const computed = sha512HexLower(buildResponseHashString(responseObj));
  const received = (responseObj.Hash || "").toLowerCase();
  return normalizeHash(computed) === normalizeHash(received);
}

async function createLegacyPayment(postObj) {
  postObj.HashCheck = generatePostHash(postObj);
  const url = `${OZOW_API_URL}/PostPaymentRequest`;
  const headers = { ApiKey: API_KEY, "Content-Type": "application/json", Accept: "application/json" };
  const resp = await axios.post(url, postObj, { headers });
  return resp.data;
}

async function getOneApiAccessToken() {
  const tokenUrl = `${ONEAPI_ENV}/auth/connect/token`;
  const res = await axios.post(
    tokenUrl,
    qs.stringify({ grant_type: "client_credentials", scope: "payment" }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, auth: { username: CLIENT_ID, password: CLIENT_SECRET } }
  );
  return res.data.access_token;
}

app.post("/api/payments/create", async (req, res) => {
  try {
    const { amount, email, firstName, lastName, reference, isTest } = req.body;
    if (MODE === "oneapi") {
      const token = await getOneApiAccessToken();
      const payload = {
        amount,
        currencyCode: "ZAR",
        transactionReference: reference || `INV-${Date.now()}`,
        customer: { firstName, lastName, email },
        redirectUrls: {
          successUrl: `${REDIRECT_BASE}/payment-success`,
          cancelUrl: `${REDIRECT_BASE}/payment-cancel`,
          errorUrl: `${REDIRECT_BASE}/payment-error`
        },
        notificationUrl: `${WEBHOOK_BASE}/api/payments/webhook`
      };
      const response = await axios.post(`${ONEAPI_ENV}/payments`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": uuidv4() }
      });
      return res.json({ paymentUrl: response.data.url || response.data.checkoutUrl || response.data });
    }
    const transactionReference = reference || `INV-${Date.now()}`;
    const postObj = {
      SiteCode: SITE_CODE,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: Number(amount).toFixed(2),
      TransactionReference: transactionReference,
      BankReference: transactionReference.slice(0, 20),
      CancelUrl: `${WEBHOOK_BASE}/api/payments/redirect/cancel`,
      ErrorUrl: `${WEBHOOK_BASE}/api/payments/redirect/error`,
      SuccessUrl: `${WEBHOOK_BASE}/api/payments/redirect/success`,
      NotifyUrl: `${WEBHOOK_BASE}/api/payments/webhook`,
      IsTest: !!isTest,
      Customer: `${firstName || ""} ${lastName || ""}`.trim()
    };
    const result = await createLegacyPayment(postObj);
    if (result && result.URL) return res.json({ paymentUrl: result.URL });
    return res.status(500).json({ error: "No URL returned", details: result });
  } catch (err) {
    console.error("Create payment error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment creation failed", details: err.response?.data || err.message });
  }
});

app.post("/api/payments/redirect/:status", (req, res) => {
  try {
    const status = req.params.status;
    const body = req.body || {};
    console.log("Redirect POST received:", status, body);
    const ok = validateResponseHash(body);
    if (!ok) return res.status(401).send("Invalid hash");
    const query = `?transactionReference=${encodeURIComponent(body.TransactionReference || "")}&status=${encodeURIComponent(body.Status || "")}&transactionId=${encodeURIComponent(body.TransactionId || "")}`;
    const redirectTo = `${REDIRECT_BASE}/payment-${status}${query}`;
    return res.redirect(302, redirectTo);
  } catch (e) {
    console.error("Redirect handler error:", e);
    return res.status(500).send("Server error");
  }
});

app.post("/api/payments/webhook", async (req, res) => {
  try {
    const body = req.body || {};
    console.log("=== Ozow Notification Received ===");
    console.log("Body:", JSON.stringify(body, null, 2));
    const ok = validateResponseHash(body);
    if (!ok) return res.sendStatus(401);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.sendStatus(500);
  }
});

app.get("/api/payments/check", async (req, res) => {
  try {
    const { reference, siteCode } = req.query;
    if (!reference) return res.status(400).json({ error: "reference required" });
    const sc = siteCode || SITE_CODE;
    const url = `${OZOW_API_URL}/GetTransactionByReference?siteCode=${encodeURIComponent(sc)}&transactionReference=${encodeURIComponent(reference)}`;
    const headers = { ApiKey: API_KEY, Accept: "application/json" };
    const response = await axios.get(url, { headers });
    return res.json(response.data);
  } catch (err) {
    console.error("GetTransactionByReference error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch transaction", details: err.response?.data || err.message });
  }
});

app.get("/health", (req, res) => res.send({ status: "ok", mode: MODE }));

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (mode=${MODE})`);
  console.log(`➡️ Redirect base: ${REDIRECT_BASE}`);
  console.log(`➡️ Webhook base: ${WEBHOOK_BASE}`);
});
