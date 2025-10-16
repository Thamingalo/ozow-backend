import axios from 'axios';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

export const initiatePayment = async (req, res) => {
  try {
    const {
      OZOW_SITE_CODE,
      OZOW_COUNTRY_CODE,
      OZOW_CURRENCY_CODE,
      OZOW_PRIVATE_KEY,
      OZOW_API_KEY,
      OZOW_NOTIFY_URL,
      OZOW_IS_TEST
    } = process.env;

    const { amount = '25.00', transactionReference = 'INV-TEST-001', bankReference = 'INV-TEST-001' } = req.body;

    const payload = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: OZOW_COUNTRY_CODE,
      CurrencyCode: OZOW_CURRENCY_CODE,
      Amount: amount,
      TransactionReference: transactionReference,
      BankReference: bankReference,
      CancelUrl: 'https://www.mzansilearnai.co.za/api/payments/redirect/cancel',
      ErrorUrl: 'https://www.mzansilearnai.co.za/api/payments/redirect/error',
      SuccessUrl: 'https://www.mzansilearnai.co.za/api/payments/redirect/success',
      NotifyUrl: OZOW_NOTIFY_URL,
      IsTest: OZOW_IS_TEST
    };

    const hashString = `${payload.SiteCode}${payload.CountryCode}${payload.CurrencyCode}${payload.Amount}${payload.TransactionReference}${payload.BankReference}${payload.CancelUrl}${payload.ErrorUrl}${payload.SuccessUrl}${payload.NotifyUrl}${payload.IsTest}${OZOW_PRIVATE_KEY}`;
    const hashCheck = CryptoJS.SHA512(hashString).toString(CryptoJS.enc.Hex).toUpperCase();
    payload.HashCheck = hashCheck;
    payload.ApiKey = OZOW_API_KEY;

    console.log('📦 Sending Payload:', payload);

    const form = new URLSearchParams(payload);
    const ozowResponse = await axios.post('https://pay.ozow.com', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    res.send(ozowResponse.data);
  } catch (error) {
    console.error('❌ Error initiating payment:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};
