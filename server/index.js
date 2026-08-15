import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import customerAuthRoutes from './routes/customerAuth.js';
import productRoutes from './routes/products.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes from './routes/payments.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';

await connectDB();

const app = express();

// TIP: cors() without options allows any origin — fine for local
// dev, but in production you want it locked to your actual frontend
// URL so random sites can't call your API from a browser. We're
// already reading CLIENT_URL from .env for the Paystack callback,
// so it's set up to tighten this later:
// app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(cors());
app.use(express.json()); // lets req.body work for JSON requests

// TIP: every route file gets "mounted" under a base path here.
// A request to POST /api/auth/login actually runs the '/login'
// handler inside routes/auth.js — Express combines the prefix
// you set here with whatever path is defined inside that file.
app.use('/api/auth', authRoutes);
app.use('/api/auth/customer', customerAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/account/addresses', addressRoutes);

app.get('/', (req, res) => res.send("Lara's Crochet API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
