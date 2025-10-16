import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['https://www.mzansilearnai.co.za', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ozow Configuration from Environment Variables
const OZOW_CONFIG = {
  siteCode: process.env.OZOW_SITE_CODE,
  countryCode: process.env.OZOW_COUNTRY_CODE || 'ZA',
  currencyCode: process.env.OZOW_CURRENCY_CODE || 'ZAR',
  apiKey: process.env.OZOW_API_KEY,
  privateKey: process.env.OZOW_PRIVATE_KEY,
  notifyUrl: process.env.OZOW_NOTIFY_URL,
  cancelUrl: process.env.OZOW_CANCEL_URL,
  errorUrl: process.env.OZOW_ERROR_URL,
  successUrl: process.env.OZOW_SUCCESS_URL,
  isTest: process.env.OZOW_IS_TEST === 'true'
};

// Generate SHA512 Hash for Ozow
function generateOzowHash(data) {
  const hashString = [
    data.SiteCode,
    data.CountryCode,
    data.CurrencyCode,
    data.Amount,
    data.TransactionReference,
    data.BankReference,
    data.Customer,
    data.CancelUrl,
    data.ErrorUrl,
    data.SuccessUrl,
    data.NotifyUrl,
    data.IsTest,
    OZOW_CONFIG.privateKey
  ].join('');
  
  return crypto.createHash('sha512').update(hashString, 'utf8').digest('hex');
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    config: {
      siteCode: OZOW_CONFIG.siteCode,
      isTest: OZOW_CONFIG.isTest,
      hasPrivateKey: !!OZOW_CONFIG.privateKey
    }
  });
});

// Initialize Payment Endpoint
app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { 
      amount, 
      transactionReference, 
      bankReference, 
      customer,
      cancelUrl,
      errorUrl,
      successUrl,
      notifyUrl,
      isTest,
      metadata 
    } = req.body;

    // Validate required fields
    if (!amount || !transactionReference || !customer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Build Ozow payment request
    const ozowData = {
      SiteCode: OZOW_CONFIG.siteCode,
      CountryCode: OZOW_CONFIG.countryCode,
      CurrencyCode: OZOW_CONFIG.currencyCode,
      Amount: parseFloat(amount).toFixed(2),
      TransactionReference: transactionReference,
      BankReference: bankReference || transactionReference,
      Customer: customer.email || customer.name,
      CancelUrl: cancelUrl || OZOW_CONFIG.cancelUrl,
      ErrorUrl: errorUrl || OZOW_CONFIG.errorUrl,
      SuccessUrl: successUrl || OZOW_CONFIG.successUrl,
      NotifyUrl: notifyUrl || OZOW_CONFIG.notifyUrl,
      IsTest: String(isTest !== undefined ? isTest : OZOW_CONFIG.isTest)
    };

    // Generate hash
    const hash = generateOzowHash(ozowData);
    ozowData.HashCheck = hash;

    // Build Ozow payment URL
    const paymentUrl = `https://pay.ozow.com/?${new URLSearchParams(ozowData).toString()}`;

    // Store payment record (you'd typically save to database here)
    console.log('Payment initiated:', {
      transactionReference,
      amount: ozowData.Amount,
      customer: customer.email,
      metadata
    });

    res.json({
      success: true,
      url: paymentUrl,
      transactionReference: transactionReference
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Verify Payment Status Endpoint
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { transactionReference } = req.body;

    if (!transactionReference) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction reference required' 
      });
    }

    // In production, you'd check your database for the payment status
    // For now, we'll return a mock successful response
    res.json({
      success: true,
      status: 'Complete',
      transactionId: Date.now().toString(),
      transactionReference: transactionReference,
      amount: 9900, // You'd get this from your database
      statusMessage: 'Payment successful'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ozow Webhook Notification Endpoint
app.post('/api/payments/webhook', async (req, res) => {
  try {
    console.log('Ozow webhook received:', req.body);

    const {
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      StatusMessage,
      Hash
    } = req.body;

    // Verify hash to ensure request is from Ozow
    // In production, implement proper hash verification

    // Update payment status in database
    console.log('Payment webhook processed:', {
      transactionReference: TransactionReference,
      status: Status,
      amount: Amount
    });

    // Return 200 OK to Ozow
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Ozow Backend Server running on port ${PORT}`);
  console.log(`📍 Mode: ${OZOW_CONFIG.isTest ? 'TEST' : 'LIVE'}`);
  console.log(`🔐 Site Code: ${OZOW_CONFIG.siteCode}`);
});
