import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import https from "https";
import paymentRoutes from "./routes/payments.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 10000;
const MODE = process.env.OZOW_MODE || "TEST";

if (MODE === "LIVE") {
  const sslOptions = {
    key: fs.readFileSync("./certs/private.key"),
    cert: fs.readFileSync("./certs/certificate.crt"),
  };
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🔐 HTTPS Server running in LIVE mode on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log("🚀 Ozow Backend Server Running");
    console.log("====================================");
    console.log(`Port: ${PORT}`);
    console.log(`Mode: ${MODE}`);
    console.log(`Site Code: ${process.env.OZOW_SITE_CODE}`);
    console.log(`Has Private Key: ${!!process.env.OZOW_PRIVATE_KEY}`);
    console.log(`Has API Key: ${!!process.env.OZOW_API_KEY}`);
    console.log("====================================");
  });
}
