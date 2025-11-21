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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);

    // Allow common reverse proxy scenarios
    // You may want to restrict this to specific domains in production
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ServeView API is running' });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/display', displayRoutes);

// Protected admin routes
app.use('/api/admin', authenticateToken, adminRoutes);

// Serve client static files
app.use(express.static(path.join(__dirname, '..', 'client')));

// Catch-all handler: serve index.html for client-side routing
// This must be the LAST middleware to avoid interfering with API routes
app.use((req: Request, res: Response) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    const indexPath = path.join(__dirname, '..', 'client', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  } else {
    // For any unmatched routes, return 404
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
