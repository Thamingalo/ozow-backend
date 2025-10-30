import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Health route for Render uptime checks
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ✅ Payment routes
app.post("/api/payments/initiate", async (req, res) => {
  try {
    // Simulate payment initialization or forward to Ozow
    const { amount, reference } = req.body;

    if (!amount || !reference) {
      return res.status(400).json({ error: "Missing amount or reference" });
    }

    // Dummy placeholder until connected to Ozow endpoint
    return res.status(200).json({
      message: "Payment initiated successfully",
      amount,
      reference,
    });
  } catch (err) {
    console.error("[INITIATE ERROR]", err);
    res.status(500).json({ error: "Server error while initiating payment" });
  }
});

// ✅ Webhook route
app.post("/api/payments/webhook", async (req, res) => {
  try {
    console.log("🔔 Ozow webhook received:", req.body);
    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("[WEBHOOK ERROR]", err);
    res.status(500).send("Webhook processing error");
  }
});

// ✅ Render port config
const PORT = process.env.PORT || 10000;

// ✅ Start server
app.listen(PORT, () => {
  console.log("🚀 Ozow Backend Server Running");
  console.log("====================================");
  console.log(`Port: ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "production"}`);
  console.log(`Site Code: ${process.env.OZOW_SITE_CODE || "Not Set"}`);
  console.log(`Has Private Key: ${!!process.env.OZOW_PRIVATE_KEY}`);
  console.log(`Has API Key: ${!!process.env.OZOW_API_KEY}`);
  console.log("====================================");
});
