import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import displayRoutes from './routes/display';

// Middleware
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/photos';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Micboard API is running' });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/display', displayRoutes);

// Protected admin routes
app.use('/api/admin', authenticateToken, adminRoutes);

// Serve client static files
app.use(express.static(path.join(__dirname, '..', 'client')));

// Catch all handler: send back index.html for client-side routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Micboard server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
});
