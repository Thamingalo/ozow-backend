import express from 'express';
import { initiatePayment, ozowWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Route to start payment process
router.post('/initiate', initiatePayment);

// Webhook route for Ozow to notify payment results
router.post('/webhook', ozowWebhook);

export default router;
