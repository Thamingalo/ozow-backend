import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payments.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ status: "ok", env: process.env.NODE_ENV || "development" });
});

app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Ozow backend v6.2 running on port ${PORT}`));
