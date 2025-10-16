import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export const initiatePayment = async (req, res) => {
  try {
    const {
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
    } = req.body;

    const privateKey = process.env.OZOW_PRIVATE_KEY;
    const apiKey = process.env.OZOW_API_KEY;

    // 🔐 Create hash string
    const hashString = `${SiteCode}${CountryCode}${CurrencyCode}${Amount}${TransactionReference}${BankReference}${CancelUrl}${ErrorUrl}${SuccessUrl}${NotifyUrl}${IsTest}${privateKey}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toUpperCase();

    // 🧾 Build payload
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
      HashCheck: hash,
      ApiKey: apiKey,
    };

    console.log('✅ Test Payment Payload:', payload);
    return res.status(200).json({
      message: 'Payment initiated successfully',
      payload,
    });
  } catch (error) {
    console.error('❌ Error initiating payment:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Webhook endpoint (Ozow sends status updates here)
export const ozowWebhook = async (req, res) => {
  console.log('📩 Ozow Webhook Received:', req.body);
  res.status(200).json({ message: 'Webhook received successfully' });
};
