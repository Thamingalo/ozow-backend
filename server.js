import express from "express";
import dotenv from "dotenv";
import paymentsRouter from "./routes/payments.js";

dotenv.config();
const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV || "production" }));
app.use("/api/payments", paymentsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Ozow backend v6.1 running on port ${PORT}`));
