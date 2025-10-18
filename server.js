// server.js
import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express(); // ✅ Must be defined before using app.post()

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIG ---
const PORT = process.env.PORT || 10000;
const MODE = process.env.MODE || 'TEST';
const SITE_CODE = process.env.SITE_CODE || 'TSTSTE0001';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'demo-private-key';

// --- HELPERS ---
function generateHash(dataString, privateKey) {
  return crypto.createHash('sha512').update(dataString + privateKey).digest('hex');
}

// --- ROUTES ---

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: '✅ Ozow Secure Backend running', mode: MODE });
});

// Webhook endpoint
app.post('/api/payments/webhook', (req, res) => {
  console.log('🟣 Ozow webhook received');
  const data = req.body;

  const result = {
    transactionReference: data.TransactionReference,
    status: data.Status,
    amount: data.Amount,
  };

  console.log('Webhook data:', data);
  console.log('Webhook processed:', result);

  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
    data: result,
  });
});

// Hash generation endpoint (optional for testing)
app.post('/api/payments/generate-hash', (req, res) => {
  const { dataString } = req.body;
  const hash = generateHash(dataString, PRIVATE_KEY);
  res.status(200).json({ hash });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${MODE} mode`);
});
