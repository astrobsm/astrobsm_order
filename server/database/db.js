const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
require('dotenv').config();

// Mock mode for UI testing without database
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// Enhanced SSL configuration for production environments with self-signed certificates
function getSSLConfig(mode = 'default') {
  // Allow explicit SSL disabling via environment variable
  if (process.env.DB_SSL_DISABLED === 'true' || process.env.NODE_ENV !== 'production') {
    return false;
  }
  
  switch (mode) {
    case 'disabled':
      return false;
    case 'relaxed':
      return {
        rejectUnauthorized: false,
        ca: false,
        cert: false,
        key: false,
        checkServerIdentity: () => undefined,
        secureProtocol: 'TLS_method'
      };
    case 'minimal':
      return { rejectUnauthorized: false };
    default:
      return {
        rejectUnauthorized: false,
        ca: false,
        checkServerIdentity: () => undefined
      };
  }
}

// Create alternative pool configurations for fallback
function createPoolConfig(sslMode = 'default') {
  let config;
  
  if (process.env.DATABASE_URL) {
    const parsed = parse(process.env.DATABASE_URL);
    config = {
      ...parsed,
      ssl: getSSLConfig(sslMode)
    };
  } else {
    config = {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: getSSLConfig(sslMode)
    };
  }
  
  return config;
}

// Create main pool configuration with fallback SSL modes
const poolConfig = createPoolConfig('default');

console.log('🔧 Database configuration:', {
  environment: process.env.NODE_ENV || 'development',
  hasConnectionString: !!process.env.DATABASE_URL,
  sslEnabled: !!poolConfig.ssl,
  host: poolConfig.host || 'from connection string',
  database: poolConfig.database || 'from connection string'
});

const pool = new Pool(poolConfig);

// Enhanced connection monitoring
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  console.error('Database connection lost, attempting to reconnect...');
});

pool.on('acquire', (client) => {
  console.log('📦 Client acquired from pool');
});

pool.on('release', (err, client) => {
  if (err) {
    console.error('❌ Error releasing client:', err.stack);
  }
});

// Enhanced test connection with multiple SSL fallback attempts
pool.testConnection = async () => {
  const sslModes = ['default', 'relaxed', 'minimal', 'disabled'];
  let lastError;
  
  for (let i = 0; i < sslModes.length; i++) {
    const mode = sslModes[i];
    console.log(`🔄 Attempting database connection (SSL mode: ${mode})...`);
    
    let testPool;
    let client;
    
    try {
      // Create a test pool with the current SSL mode
      const testConfig = createPoolConfig(mode);
      testPool = new Pool(testConfig);
      
      client = await testPool.connect();
      
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('🔍 Database connection successful:', {
        time: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ').slice(0, 2).join(' '),
        sslMode: mode,
        ssl: process.env.NODE_ENV === 'production' ? 'enabled (self-signed accepted)' : 'disabled'
      });
      
      // If successful, update the main pool configuration
      if (mode !== 'default') {
        console.log(`📝 Updating main pool to use SSL mode: ${mode}`);
        pool.options = testConfig;
      }
      
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ Connection failed with SSL mode '${mode}':`, error.message);
      
      // Provide specific guidance for SSL-related errors on final attempt
      if (i === sslModes.length - 1) {
        if (error.message.includes('self signed certificate') || 
            error.message.includes('certificate') ||
            error.message.includes('SSL') ||
            error.message.includes('EPROTO')) {
          console.error('🔧 SSL Certificate Issue (all modes failed):');
          console.error('   - Database may not support SSL connections');
          console.error('   - Try setting sslmode=disable in DATABASE_URL');
          console.error('   - Check with database provider about SSL requirements');
        }
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          console.error('🌐 Network/Host Issue:');
          console.error('   - Check database host/port in DATABASE_URL');
          console.error('   - Verify network connectivity to database server');
        }
      }
    } finally {
      if (client) {
        client.release();
      }
      if (testPool && testPool !== pool) {
        await testPool.end();
      }
    }
  }
  
  throw lastError;
};

// Export mock pool if in mock mode
if (MOCK_MODE) {
  console.log('🧪 Running in MOCK MODE - Database connections will be simulated');
  
  const mockPool = {
    query: async (text, params) => {
      console.log('🧪 Mock query:', text, params);
      return { rows: [], rowCount: 0 };
    },
    testConnection: async () => {
      console.log('🧪 Mock database connection test - SUCCESS');
      return Promise.resolve();
    },
    end: async () => {
      console.log('🧪 Mock database connection ended');
    }
  };
  
  module.exports = mockPool;
} else {
  module.exports = pool;
}
