require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const seed = require('./seed');

const authRoutes = require('./routes/auth');
const collegeRoutes = require('./routes/colleges');
const activityRoutes = require('./routes/activities');
const followupRoutes = require('./routes/followups');
const startupRoutes = require('./routes/startups');
const courseRoutes = require('./routes/courses');
const proposalRoutes = require('./routes/proposals');
const dashboardRoutes = require('./routes/dashboard');
const exportImportRoutes = require('./routes/exportImport');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export-import', exportImportRoutes);

// Database backup endpoint (Authenticated)
const { authenticate } = require('./middleware/auth');
app.get('/api/backup/download', authenticate, (req, res) => {
  try {
    db.saveDB();
    const dbPath = db.getDBPath();
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found.' });
    }
    res.download(dbPath, `crm_backup_${new Date().toISOString().split('T')[0]}.sqlite`);
  } catch (err) {
    console.error('Backup download error:', err);
    res.status(500).json({ error: 'Failed to download database backup.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'SQLite (sql.js persistent)'
  });
});

// Serve frontend build if present
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static production frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Initialize DB and start server
async function startServer() {
  try {
    await db.initDB();
    console.log('Database initialized successfully.');

    // Run seed if no users exist
    await seed();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 Sales CRM & Outreach Tracking Server is running!`);
      console.log(`📡 Local API: http://localhost:${PORT}`);
      console.log(`🌐 Network API (for mobile/tablet): http://0.0.0.0:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
