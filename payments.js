import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const router = express.Router();

router.post("/initiate", async (req, res) => {
  try {
    const { amount, firstName, lastName, reference, isTest } = req.body;

    if (!amount || isNaN(amount)) return res.status(400).json({ error: "Invalid amount" });

    const siteCode = process.env.OZOW_SITE_CODE;
    const countryCode = "ZA";
    const currencyCode = "ZAR";
    const privateKey = process.env.OZOW_PRIVATE_KEY;
    const apiKey = process.env.OZOW_API_KEY;
    const redirectBase = process.env.REDIRECT_BASE_URL;
    const webhookBase = process.env.WEBHOOK_BASE_URL;

    const cancelUrl = `${redirectBase}/api/payments/redirect/cancel`;
    const errorUrl = `${redirectBase}/api/payments/redirect/error`;
    const successUrl = `${redirectBase}/api/payments/redirect/success`;
    const notifyUrl = `${webhookBase}/api/payments/webhook`;

    const hashString = `${siteCode}${countryCode}${currencyCode}${Number(amount).toFixed(2)}${reference}${reference}${cancelUrl}${errorUrl}${successUrl}${notifyUrl}${isTest}${privateKey}`.toLowerCase();
    console.log("🧩 Hash String:", hashString);
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");
    console.log("🔐 Generated Hash:", hash);

    const payload = {
      requestFields: {
        SiteCode: siteCode,
        CountryCode: countryCode,
        CurrencyCode: currencyCode,
        Amount: Number(amount).toFixed(2),
        TransactionReference: reference,
        BankReference: reference,
        CancelUrl: cancelUrl,
        ErrorUrl: errorUrl,
        SuccessUrl: successUrl,
        NotifyUrl: notifyUrl,
        IsTest: isTest,
        HashCheck: hash
      }
    };

    console.log("📦 Payload sent to Ozow:", payload);

    const response = await fetch("https://api.ozow.com/PostPaymentRequest", {
      method: "POST",
      headers: {
        "ApiKey": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("💳 Ozow Response:", result);

    if (result?.url) return res.json({ paymentRequestId: result.paymentRequestId, url: result.url });
    res.status(400).json({ error: "No URL returned", details: result });
  } catch (err) {
    console.error("❌ Create payment error:", err);
    res.status(500).json({ error: "Payment creation failed", details: err.message });
  }
});

export default router;
