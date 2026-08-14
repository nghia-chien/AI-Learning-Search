import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './router/healthRouter';
import searchRouter from './router/searchRouter';
import { initDb } from './config/db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase DB table if DATABASE_URL is set
initDb();

// Routes
app.use('/api', healthRouter);
app.use('/api', searchRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
