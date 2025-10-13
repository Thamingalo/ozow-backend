// server.js
import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Config via environment variables (set these in Render/Heroku/GitHub Secrets)
const SiteCode = process.env.OZOW_SITECODE || 'TSTSTE0001';
const CountryCode = process.env.OZOW_COUNTRYCODE || 'ZA';
const CurrencyCode = process.env.OZOW_CURRENCYCODE || 'ZAR';
const PrivateKey = process.env.OZOW_PRIVATEKEY || ''; // DO NOT COMMIT PRODUCTION KEYS
const ApiKey = process.env.OZOW_APIKEY || '';
const IsTest = process.env.OZOW_ISTEST === 'true' || true;

const CancelUrl = process.env.OZOW_CANCELURL || 'https://www.mzansilearnai.co.za/api/payments/redirect/cancel';
const ErrorUrl = process.env.OZOW_ERRORURL || 'https://www.mzansilearnai.co.za/api/payments/redirect/error';
const SuccessUrl = process.env.OZOW_SUCCESSURL || 'https://www.mzansilearnai.co.za/api/payments/redirect/success';
const NotifyUrl = process.env.OZOW_NOTIFYURL || 'https://ozow-backend.onrender.com/api/payments/webhook';

app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { amount, reference } = req.body;

    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    // Format amount to 2 decimal places string
    const Amount = parseFloat(amount).toFixed(2);
    const TransactionReference = reference || `INV-${Date.now()}`;
    const BankReference = TransactionReference;

    // Build hash string - order matters
    const hashString = `${SiteCode}${CountryCode}${CurrencyCode}${Amount}${TransactionReference}${BankReference}${CancelUrl}${ErrorUrl}${SuccessUrl}${NotifyUrl}${IsTest}${PrivateKey}`;
    console.log('🧩 Hash String:', hashString);

    const HashCheck = crypto.createHash('sha512').update(hashString, 'utf8').digest('hex');
    console.log('🔐 Hash Generated:', HashCheck);

    const payload = {
      SiteCode,
      CountryCode,
      CurrencyCode,
      Amount,
      TransactionReference,
      BankReference,
      CancelUrl,
      ErrorUrl,
      SuccessUrl,
      NotifyUrl,
      IsTest,
      HashCheck
    };

    console.log('📦 Payload sent to Ozow:', payload);

    // POST to Ozow
    const ozowRes = await axios.post('https://api.ozow.com/v3/transactions', payload, {
      headers: {
        'apiKey': ApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('✅ Ozow Response:', ozowRes.data);
    return res.json(ozowRes.data);
  } catch (err) {
    console.error('💳 Ozow Error:', err.response?.data || err.message || err);
    return res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

// Webhook endpoint to receive NotifyUrl callbacks
app.post('/api/payments/webhook', (req, res) => {
  console.log('📥 Webhook received:', req.body);
  // TODO: Add validation of webhook payload if needed
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Ozow backend running on port ${PORT}`));
