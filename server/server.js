const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const databaseRoutes = require('./routes/database');
const diagnosticsRoutes = require('./routes/diagnostics');
const databaseTestRoutes = require('./routes/database-test');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory (for PWA assets)
app.use(express.static(path.join(__dirname, '../'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for PWA files
    if (path.endsWith('.webmanifest') || path.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      // Prevent caching of app.js to ensure updates are loaded
      if (path.includes('app.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve public directory assets
app.use('/public', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/db-test', databaseTestRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve admin tools page
app.get('/admin-tools', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-tools.html'));
});

// Serve diagnostics page
app.get('/diagnostics', (req, res) => {
  res.sendFile(path.join(__dirname, '../diagnostics.html'));
});

// Serve diagnostics script
app.get('/production-diagnostics.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-diagnostics.js'));
});

// Serve improved diagnostics script
app.get('/improved-diagnostics.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../improved-diagnostics.js'));
});

// Serve production database fix script
app.get('/production-database-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-database-fix.js'));
});

// Serve quick diagnostics script
app.get('/quick-diagnostics.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../quick-diagnostics.js'));
});

// Serve production schema fix script
app.get('/production-schema-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-schema-fix.js'));
});

// Serve production schema fix script (CSP-safe version)
app.get('/production-schema-fix-safe.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-schema-fix-safe.js'));
});

// Serve schema investigation script
app.get('/schema-investigation-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../schema-investigation-fix.js'));
});

// Serve final production fix script
app.get('/final-production-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../final-production-fix.js'));
});

// PWA routes - serve main app for all non-API routes (SPA behavior)
app.get('*', (req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/public/') ||
      req.path.includes('.')) {
    return next();
  }
  // Serve main app for all other routes
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`App available at http://localhost:${PORT}`);
});

module.exports = app;
