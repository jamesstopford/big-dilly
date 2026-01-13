import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../db/init.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import todoRoutes from './routes/todos.js';
import templateRoutes from './routes/template.js';
import trackerRoutes from './routes/trackers.js';
import { getDb } from '../db/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database on startup
try {
  // Ensure data directory exists
  const fs = await import('fs');
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  getDb(); // Initialize the connection
  console.log('Database connection established');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/trackers', trackerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
