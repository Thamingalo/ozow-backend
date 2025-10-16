import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Ozow backend running on port ${PORT}`));
