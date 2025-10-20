// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration — allow both Base44 and production app
app.use(cors({
  origin: [
    'https://www.mzansilearnai.co.za',       // Production
    'https://mzansi-learn-70007047.base44.app', // Base44 test/staging
    'https://mzansilearnai.app'              // Optional app domain
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

// ✅ Environment Variables
const PORT = process.env.PORT || 10000;
const MODE = process.env.MODE || 'TEST';
const SITE_CODE = process.env.SITE_CODE || 'TSTSTE0001';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'demo-private-key';

// ✅ 1. Health Check
app.get('/', (req, res) => {
  res.json({
    message: '✅ Ozow Secure Backend running',
    mode: MODE,
    status: 'active',
  });
});

// ✅ 2. Hash Generator (Working)
app.post('/api/payments/generate-hash', (req, res) => {
  try {
    const { dataString } = req.body;
    if (!dataString) return res.status(400).json({ success: false, message: 'Missing dataString' });

    const hash = crypto.createHash('sha512').update(dataString + PRIVATE_KEY).digest('hex');
    res.json({ success: true, hash });
  } catch (error) {
    console.error('❌ Hash generation failed:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ 3. Initiate Payment
app.post('/api/payments/initiate', (req, res) => {
  console.log('POST /api/payments/initiate hit ✅');
  console.log('Payload:', req.body);

  const { amount, transactionReference, customer } = req.body;
  if (!amount || !transactionReference) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // ✅ Simulated Ozow-style payment initiation
  const redirectUrl = `https://ozow.io/pay/${transactionReference}`;
  return res.status(200).json({
    success: true,
    message: 'Payment initiation successful (TEST MODE)',
    siteCode: SITE_CODE,
    transactionReference,
    amount,
    customer,
    redirectUrl,
  });
});

// ✅ 4. Webhook
app.post('/api/payments/webhook', (req, res) => {
  console.log('🟣 Ozow webhook received');
  console.log('Webhook data:', req.body);

  try {
    const { SiteCode, TransactionId, TransactionReference, Amount, Status, Hash } = req.body;

    // (Optional) Add hash validation logic
    const dataString = `${SiteCode}${TransactionId}${TransactionReference}${Amount}${Status}`;
    const computedHash = crypto.createHash('sha512').update(dataString + PRIVATE_KEY).digest('hex');

    if (MODE === 'LIVE' && computedHash !== Hash) {
  console.warn('⚠️ Invalid webhook hash. Possible tampering detected.');
  return res.status(400).json({ success: false, message: 'Invalid hash' });
} else if (MODE === 'TEST') {
  console.log('✅ TEST MODE: Skipping hash validation.');
}

    console.log('Webhook processed:', {
      transactionReference: TransactionReference,
      status: Status,
      amount: Amount,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log('🚀 Ozow Backend Server Running');
  console.log('====================================');
  console.log(`Port: ${PORT}`);
  console.log(`Mode: ${MODE}`);
  console.log(`Site Code: ${SITE_CODE}`);
  console.log(`Has Private Key: ${PRIVATE_KEY ? 'YES' : 'NO'}`);
  console.log('====================================');
});
