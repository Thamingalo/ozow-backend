// server.js
import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;
const MODE = process.env.MODE || 'TEST';
const SITE_CODE = process.env.SITE_CODE || 'TSTSTE0001';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'demo-private-key';

// ✅ 1. Health Check
app.get('/', (req, res) => {
  res.json({ message: '✅ Ozow Secure Backend running', mode: MODE });
});

// ✅ 2. Hash Generator (already working)
app.post('/api/payments/generate-hash', (req, res) => {
  const { dataString } = req.body;
  const hash = crypto.createHash('sha512').update(dataString + PRIVATE_KEY).digest('hex');
  res.json({ success: true, hash });
});

// ✅ 3. Initiate Payment (the missing route)
app.post('/api/payments/initiate', (req, res) => {
  console.log('POST /api/payments/initiate hit ✅');
  console.log('Payload:', req.body);

  const { amount, transactionReference, customer } = req.body;

  if (!amount || !transactionReference) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Simulated response to represent Ozow-style initiation
  return res.status(200).json({
    success: true,
    message: 'Payment initiation successful (TEST MODE)',
    siteCode: SITE_CODE,
    transactionReference,
    amount,
    customer,
    redirectUrl: `https://ozow.io/pay/${transactionReference}`,
  });
});

// ✅ 4. Webhook
app.post('/api/payments/webhook', (req, res) => {
  console.log('🟣 Ozow webhook received', req.body);
  res.status(200).json({ success: true });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${MODE} mode`);
});
