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

const SiteCode = process.env.OZOW_SITECODE;
const SiteName = process.env.OZOW_SITENAME;
const CountryCode = process.env.OZOW_COUNTRYCODE;
const CurrencyCode = process.env.OZOW_CURRENCYCODE;
const PrivateKey = process.env.OZOW_PRIVATEKEY;
const ApiKey = process.env.OZOW_APIKEY;
const IsTest = process.env.OZOW_ISTEST === 'true';

const CancelUrl = process.env.OZOW_CANCELURL;
const ErrorUrl = process.env.OZOW_ERRORURL;
const SuccessUrl = process.env.OZOW_SUCCESSURL;
const NotifyUrl = process.env.OZOW_NOTIFYURL;

app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { amount, reference } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Amount must be a valid number' });
    const Amount = parseFloat(amount).toFixed(2);
    const TransactionReference = reference || `INV-${Date.now()}`;
    const BankReference = TransactionReference;
    const hashString = `${SiteCode}${CountryCode}${CurrencyCode}${Amount}${TransactionReference}${BankReference}${CancelUrl}${ErrorUrl}${SuccessUrl}${NotifyUrl}${IsTest}${PrivateKey}`;
    const HashCheck = crypto.createHash('sha512').update(hashString, 'utf8').digest('hex');
    const payload = { SiteCode, CountryCode, CurrencyCode, Amount, TransactionReference, BankReference, CancelUrl, ErrorUrl, SuccessUrl, NotifyUrl, IsTest, HashCheck };
    const ozowRes = await axios.post('https://api.ozow.com/PostPaymentRequest', payload, { headers: { 'apiKey': ApiKey, 'Content-Type': 'application/json' } });
    res.json(ozowRes.data);
  } catch (err) {
    console.error('Ozow Error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

app.post('/api/payments/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Ozow backend live v2 running on port ${PORT}`));
