import express from 'express';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`💳 Ozow Test Backend running on port ${PORT}`));
