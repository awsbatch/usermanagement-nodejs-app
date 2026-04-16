// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/index.js';
import { initDb } from './models/dbAdapter.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    db: config.useMongoDb ? 'mongodb' : 'memory',
    version: '1.0.0',
    node: process.version,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
async function start() {
  try {
    const db = await initDb();
    // Seed admin for MongoDB mode
    if (config.useMongoDb && db.seedAdmin) {
      await db.seedAdmin();
    }

    app.listen(config.port, () => {
      console.log(`\n🚀 UserVault running at http://localhost:${config.port}`);
      console.log(`📦 Storage: ${config.useMongoDb ? '🍃 MongoDB (' + config.mongoUri + ')' : '💾 In-Memory'}`);
      console.log(`\n🔑 Default credentials: admin@example.com / admin123\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
