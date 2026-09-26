import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import profileRoutes from './routes/profile.js';
import paymentRoutes, { razorpayWebhook } from './routes/payment.js';
import { notFound, errorHandler } from './middleware/validate.js';

const app = express();

app.set('trust proxy', 1);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Razorpay webhook needs the raw body for signature verification —
// mount it before express.json().
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'hotel-sri-vari-api', time: new Date().toISOString() })
);

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payment', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotel_sri_vari').then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏨 Hotel Sri Vari API listening on http://0.0.0.0:${PORT}`);
  });
});
