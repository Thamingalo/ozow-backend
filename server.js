import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import querystring from "querystring";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;

// 🔐 TEST CREDENTIALS (use environment variables for production)
const ozowConfig = {
  siteCode: "TSTSTE0001",
  countryCode: "ZA",
  currencyCode: "ZAR",
  privateKey: "215114531AFF7134A94C88CEEA48E",
  apiKey: "EB5758F2C3B4DF3FF4F2669D5FF5B"
};

// 🧮 Generate Hash
function generateHash(data, privateKey) {
  const hashString = Object.values(data).join("").toUpperCase() + privateKey;
  return crypto.createHash("sha512").update(hashString).digest("hex").toUpperCase();
}

// 💳 Payment Route
app.post("/api/pay", (req, res) => {
  const paymentData = {
    SiteCode: ozowConfig.siteCode,
    CountryCode: ozowConfig.countryCode,
    CurrencyCode: ozowConfig.currencyCode,
    Amount: "25.00",
    TransactionReference: "INV-TEST-001",
    BankReference: "INV-TEST-001",
    CancelUrl: "https://www.mzansilearnai.co.za/api/payments/redirect/cancel",
    ErrorUrl: "https://www.mzansilearnai.co.za/api/payments/redirect/error",
    SuccessUrl: "https://www.mzansilearnai.co.za/api/payments/redirect/success",
    NotifyUrl: "https://ozow-backend.onrender.com/api/payments/webhook",
    IsTest: "true"
  };

  paymentData.HashCheck = generateHash(paymentData, ozowConfig.privateKey);
  paymentData.ApiKey = ozowConfig.apiKey;

  const redirectUrl = "https://pay.ozow.com/?" + querystring.stringify(paymentData);
  console.log("🔁 Redirecting user to:", redirectUrl);

  // Redirect browser to Ozow page
  res.redirect(redirectUrl);
});

// 📨 Webhook route (Ozow callback)
app.post("/api/payments/webhook", (req, res) => {
  console.log("📩 Payment Notification Received:", req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`🚀 Ozow backend running on port ${PORT}`));
