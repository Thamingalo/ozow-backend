import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || 'TSTSTE0001';
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || '215114531AFF7134A94C88CEEA48E';
const OZOW_API_URL = process.env.OZOW_API_URL || 'https://api.ozow.com';
const REDIRECT_BASE_URL = process.env.REDIRECT_BASE_URL || 'https://www.mzansilearnai.co.za';
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://ozow-backend.onrender.com';

function generateHashString(payment) {
  const {
    SiteCode, CountryCode, CurrencyCode, Amount, TransactionReference,
    BankReference, CancelUrl, ErrorUrl, SuccessUrl, NotifyUrl, IsTest
  } = payment;
  return (
    SiteCode +
    CountryCode +
    CurrencyCode +
    Amount +
    TransactionReference +
    BankReference +
    CancelUrl +
    ErrorUrl +
    SuccessUrl +
    NotifyUrl +
    IsTest +
    OZOW_PRIVATE_KEY
  ).toLowerCase();
}

function generateHash(payment) {
  const hashString = generateHashString(payment);
  console.log("🧩 Hash String:", hashString);
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  console.log("🔐 Hash Generated:", hash);
  return hash;
}

app.post('/api/payments/create', async (req, res) => {
  try {
    const { amount, reference, isTest } = req.body;
    const amountFormatted = parseFloat(amount).toFixed(2).toString();

    const paymentData = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: 'ZA',
      CurrencyCode: 'ZAR',
      Amount: amountFormatted,
      TransactionReference: reference,
      BankReference: reference,
      CancelUrl: `${REDIRECT_BASE_URL}/api/payments/redirect/cancel`,
      ErrorUrl: `${REDIRECT_BASE_URL}/api/payments/redirect/error`,
      SuccessUrl: `${REDIRECT_BASE_URL}/api/payments/redirect/success`,
      NotifyUrl: `${WEBHOOK_BASE_URL}/api/payments/webhook`,
      IsTest: isTest,
    };

    const hash = generateHash(paymentData);
    paymentData.HashCheck = hash;

    console.log("📦 Payload sent to Ozow:", JSON.stringify(paymentData, null, 2));

    const response = await fetch(`${OZOW_API_URL}/PostPaymentRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log("💳 Ozow Response:", data);

    if (data && data.url) {
      return res.json({ success: true, url: data.url, paymentRequestId: data.paymentRequestId });
    } else {
      return res.status(400).json({
        error: "No URL returned from Ozow",
        details: data
      });
    }
  } catch (err) {
    console.error("❌ Create payment error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Ozow backend v5.2 running on port ${PORT}`);
});
