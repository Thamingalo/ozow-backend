// server.js
import express from "express";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// 🔐 Ozow Production Credentials
// ===============================
const SITE_CODE = "MOK-MOK-007";
const PRIVATE_KEY = "d721541c3322432b8294e92c8e75cd32";
const API_KEY = "7b7f3cf189df446f9039dfd81d4fd84e";
const COUNTRY_CODE = "ZA";
const CURRENCY_CODE = "ZAR";

// ===============================
// 🌍 URLs (Production)
const BASE_URL = "https://www.mzansilearnai.co.za"; // your live domain
const CANCEL_URL = `${BASE_URL}/api/payments/redirect/cancel`;
const ERROR_URL = `${BASE_URL}/api/payments/redirect/error`;
const SUCCESS_URL = `${BASE_URL}/api/payments/redirect/success`;
const NOTIFY_URL = `${BASE_URL}/api/payments/redirect/notify`;

// ===============================
// 🧮 Utility: Create SHA512 Hash
// ===============================
function generateOzowHash({
  siteCode,
  countryCode,
  currencyCode,
  amount,
  transactionReference,
  bankReference,
  cancelUrl,
  errorUrl,
  successUrl,
  notifyUrl,
  isTest,
  privateKey,
}) {
  const dataString =
    `${siteCode}${countryCode}${currencyCode}${amount}${transactionReference}${bankReference}` +
    `${cancelUrl}${errorUrl}${successUrl}${notifyUrl}${isTest}${privateKey}`;

  const lower = dataString.toLowerCase();
  const hash = crypto.createHash("sha512").update(lower).digest("hex");
  return hash;
}

// ===============================
// 💳 Create Payment Endpoint
// ===============================
app.post("/api/payments/initiate", async (req, res) => {
  try {
    const { amount } = req.body;

    // ✅ Ozow requires Bank Reference ≤ 20 chars
    const transactionReference = `MZLEARN-${Date.now()}`;
    const bankReference = transactionReference.substring(0, 20);

    const isTest = false;

    const hashCheck = generateOzowHash({
      siteCode: SITE_CODE,
      countryCode: COUNTRY_CODE,
      currencyCode: CURRENCY_CODE,
      amount: parseFloat(amount).toFixed(2),
      transactionReference,
      bankReference,
      cancelUrl: CANCEL_URL,
      errorUrl: ERROR_URL,
      successUrl: SUCCESS_URL,
      notifyUrl: NOTIFY_URL,
      isTest,
      privateKey: PRIVATE_KEY,
    });

    // ✅ Return redirect URL to front-end
    const redirectUrl = `https://pay.ozow.com/?SiteCode=${SITE_CODE}&CountryCode=${COUNTRY_CODE}&CurrencyCode=${CURRENCY_CODE}&Amount=${parseFloat(
      amount
    ).toFixed(2)}&TransactionReference=${transactionReference}&BankReference=${bankReference}&CancelUrl=${encodeURIComponent(
      CANCEL_URL
    )}&ErrorUrl=${encodeURIComponent(ERROR_URL)}&SuccessUrl=${encodeURIComponent(
      SUCCESS_URL
    )}&NotifyUrl=${encodeURIComponent(NOTIFY_URL)}&IsTest=${isTest}&HashCheck=${hashCheck}`;

    res.status(200).json({
      message: "Payment initiated successfully",
      redirectUrl,
      amount,
      reference: transactionReference,
    });
  } catch (error) {
    console.error("Payment init error:", error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

// ===============================
// ✅ Health Check
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Ozow Payment Backend" });
});

// ===============================
// 🚀 Server Startup
// ===============================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Ozow Payment Server running on port ${PORT}`));
