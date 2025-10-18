// routes/payments.js
import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ✅ Hash generation using private key
function generateHash(dataString, privateKey) {
  return crypto.createHash('sha512').update(dataString + privateKey).digest('hex');
}

// 🟣 Webhook endpoint for Ozow
router.post('/webhook', (req, res) => {
  console.log('🟣 Ozow webhook received');
  const data = req.body;

  const result = {
    transactionReference: data.TransactionReference,
    status: data.Status,
    amount: data.Amount,
  };

  console.log('Webhook data:', data);
  console.log('Webhook processed:', result);

  return res.status(200).json({ success: true, message: 'Webhook processed', data: result });
});

// 🟢 Test endpoint to verify server
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Payment route working ✅' });
});

export default router;
