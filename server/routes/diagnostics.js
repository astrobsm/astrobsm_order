// Production Diagnostics Script
// Add this to your server.js temporarily to debug production issues

const express = require('express');
const router = express.Router();

// Diagnostic endpoint to check what's happening
router.get('/debug', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        host: process.env.DB_HOST || 'not set',
        port: process.env.DB_PORT || 'not set', 
        name: process.env.DB_NAME || 'not set',
        user: process.env.DB_USER || 'not set',
        password: process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]',
        ssl: process.env.DB_SSL || 'not set',
        database_url: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]'
      },
      server: {
        port: process.env.PORT || 3000,
        node_version: process.version
      }
    };

    // Test database connection if pool is available
    if (global.pool || req.app.locals.pool) {
      try {
        const pool = global.pool || req.app.locals.pool;
        const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
        diagnostics.database.connection = 'SUCCESS';
        diagnostics.database.current_time = result.rows[0].current_time;
        diagnostics.database.version = result.rows[0].db_version;
      } catch (dbError) {
        diagnostics.database.connection = 'FAILED';
        diagnostics.database.error = dbError.message;
      }
    } else {
      diagnostics.database.connection = 'POOL NOT AVAILABLE';
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostics failed',
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
