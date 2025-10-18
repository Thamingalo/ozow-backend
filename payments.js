import express from "express";
import { generateHash, verifyHash } from "../utils/hashGenerator.js";

const router = express.Router();

router.post("/initiate", async (req, res) => {
  try {
    const { amount, transactionReference, customer } = req.body;

    if (!amount || !transactionReference || !customer?.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = {
      SiteCode: process.env.OZOW_SITE_CODE,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: parseFloat(amount).toFixed(2),
      TransactionReference: transactionReference,
      BankReference: transactionReference,
      CancelUrl: process.env.CANCEL_URL,
      ErrorUrl: process.env.ERROR_URL,
      SuccessUrl: process.env.SUCCESS_URL,
      NotifyUrl: process.env.WEBHOOK_URL,
      IsTest: process.env.OZOW_MODE === "TEST"
    };

    const hash = generateHash(payload);
    const paymentUrl = `https://pay.ozow.com/?${new URLSearchParams({ ...payload, Hash: hash })}`;

    console.log(`🟢 Payment Initiated for ${transactionReference}`);
    res.json({ success: true, url: paymentUrl, payload });
  } catch (err) {
    console.error("❌ Initiate Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/webhook", async (req, res) => {
  console.log("🟣 Ozow webhook received");
  const data = req.body;

  if (!verifyHash(data)) {
    return res.status(400).json({ error: "Invalid hash signature" });
  }

  console.log("Webhook processed:", {
    transactionReference: data.TransactionReference,
    status: data.Status,
    amount: data.Amount
  });

  res.status(200).json({ message: "Webhook processed successfully" });
});

export default router;
