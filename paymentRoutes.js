import express from 'express';
import { initiatePayment } from '../controllers/paymentController.js';
const router = express.Router();

router.post('/initiate', initiatePayment);
router.post('/webhook', (req, res) => {
  console.log('📩 Ozow Webhook:', req.body);
  res.status(200).send('Webhook received');
});

export default router;
