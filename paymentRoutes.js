// routes/paymentRoutes.js
import express from "express";
import {
  initiatePayment,
  verifyPayment,
  handleWebhook
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ POST /api/payments/initiate
router.post("/initiate", initiatePayment);

// ✅ POST /api/payments/verify
router.post("/verify", verifyPayment);

// ✅ POST /api/payments/webhook
router.post("/webhook", handleWebhook);

export default router;
