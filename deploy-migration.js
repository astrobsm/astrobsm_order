#!/usr/bin/env node

/**
 * Automatic Production Migration Script
 * 
 * This script automatically runs database migrations during deployment.
 * It checks if migrations are needed and applies them safely.
 * 
 * Usage:
 * node deploy-migration.js
 * 
 * Environment Variables:
 * - NODE_ENV: should be 'production' for production deployments
 * - DATABASE_URL: PostgreSQL connection string for production
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction 
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : require('./server/database/db.js').options;

const pool = new Pool(dbConfig);

// Migration tracking table
const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// List of migrations to run in order
const MIGRATIONS = [
  {
    name: 'add_email_to_customers',
    description: 'Add email column to customers table',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);`
  },
  {
    name: 'add_delivery_address_to_orders',
    description: 'Add delivery_address column to orders table',
    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;`
  },
  {
    name: 'create_indexes',
    description: 'Create performance indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    `
  }
];

async function checkMigrationStatus(migrationName) {
  try {
    const result = await pool.query(
      'SELECT * FROM migrations WHERE name = $1',
      [migrationName]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.log(`Migration table doesn't exist yet, will create it.`);
    return false;
  }
}

async function recordMigration(migrationName) {
  await pool.query(
    'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    [migrationName]
  );
}

async function runMigration(migration) {
  const { name, description, sql } = migration;
  
  console.log(`\n🔄 Running migration: ${name}`);
  console.log(`   Description: ${description}`);
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    // Run the migration SQL
    await pool.query(sql);
    
    // Record that migration was executed
    await recordMigration(name);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log(`✅ Migration completed: ${name}`);
    return true;
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error(`❌ Migration failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ Database connected successfully at ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function checkTablesExist() {
  try {
    const tables = ['customers', 'orders', 'products'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (!result.rows[0].exists) {
        console.error(`❌ Required table '${table}' does not exist`);
        return false;
      }
    }
    console.log(`✅ All required tables exist`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking tables: ${error.message}`);
    return false;
  }
}

async function runDeploymentMigrations() {
  console.log('🚀 Starting Automatic Production Migration');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  
  try {
    // Check database connection
    if (!(await checkDatabaseConnection())) {
      process.exit(1);
    }
    
    // Check required tables exist
    if (!(await checkTablesExist())) {
      console.error('❌ Database schema is incomplete. Please run initial setup first.');
      process.exit(1);
    }
    
    // Create migrations table if it doesn't exist
    console.log('\n📋 Setting up migration tracking...');
    await pool.query(MIGRATIONS_TABLE);
    console.log('✅ Migration tracking ready');
    
    // Run each migration
    console.log('\n🔧 Checking and running migrations...');
    let migrationsRun = 0;
    let migrationsSkipped = 0;
    
    for (const migration of MIGRATIONS) {
      const alreadyRun = await checkMigrationStatus(migration.name);
      
      if (alreadyRun) {
        console.log(`⏭️  Skipping migration: ${migration.name} (already applied)`);
        migrationsSkipped++;
      } else {
        const success = await runMigration(migration);
        if (success) {
          migrationsRun++;
        } else {
          console.error(`❌ Migration failed, stopping deployment`);
          process.exit(1);
        }
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrations applied: ${migrationsRun}`);
    console.log(`   ⏭️  Migrations skipped: ${migrationsSkipped}`);
    console.log(`   🎯 Total migrations: ${MIGRATIONS.length}`);
    
    if (migrationsRun > 0) {
      console.log('\n🎉 Database migration completed successfully!');
    } else {
      console.log('\n✨ Database is up to date, no migrations needed.');
    }
    
  } catch (error) {
    console.error(`\n💥 Deployment migration failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runDeploymentMigrations();
}

module.exports = { runDeploymentMigrations };
