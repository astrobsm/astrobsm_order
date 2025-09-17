const pool = require('./db');

async function createUserManagementTables() {
  console.log('🔧 Creating user management tables...');
  
  const client = await pool.connect();
  
  try {
    // Create user_roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        role_display_name VARCHAR(100) NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL DEFAULT '[]',
        password_hash VARCHAR(255),
        requires_password BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles
    const defaultRoles = [
      {
        role_name: 'customer',
        role_display_name: 'Customer',
        description: 'Standard customer access to place orders',
        permissions: JSON.stringify(['place_orders', 'view_products', 'view_order_status']),
        password_hash: null,
        requires_password: false
      },
      {
        role_name: 'sales_staff',
        role_display_name: 'Sales Staff',
        description: 'Sales staff with limited access to place orders, view orders, and generate invoices/receipts',
        permissions: JSON.stringify([
          'place_orders', 'view_products', 'view_order_status', 'view_all_orders',
          'generate_invoices', 'generate_receipts'
        ]),
        password_hash: '$2a$10$S6n2dfqTP83kkoHZu2ryEO3f81BXAAo8ILV1fI7WoxSjm.EffKPae', // bcrypt hash for 'unicorn'
        requires_password: true
      },
      {
        role_name: 'superadmin',
        role_display_name: 'Super Administrator',
        description: 'Full system access including user management and system settings',
        permissions: JSON.stringify([
          'place_orders', 'view_products', 'view_order_status', 'view_all_orders',
          'generate_invoices', 'generate_receipts', 'view_notifications', 'export_orders',
          'manage_products', 'manage_stock', 'view_admin_panel', 'system_settings',
          'priceChanges', 'notifications', 'manage_users'
        ]),
        password_hash: '$2a$10$ileOxLsHw5Ubq5ZtiIj8qOienViZNJ64QezXg9ZSc3vJzuA/TkyjO', // bcrypt hash for 'natiss'
        requires_password: true
      }
    ];

    // Insert default roles if they don't exist
    for (const role of defaultRoles) {
      await client.query(`
        INSERT INTO user_roles (role_name, role_display_name, description, permissions, password_hash, requires_password)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (role_name) DO UPDATE SET
          role_display_name = EXCLUDED.role_display_name,
          description = EXCLUDED.description,
          permissions = EXCLUDED.permissions,
          password_hash = COALESCE(user_roles.password_hash, EXCLUDED.password_hash),
          requires_password = EXCLUDED.requires_password,
          updated_at = CURRENT_TIMESTAMP
      `, [role.role_name, role.role_display_name, role.description, role.permissions, role.password_hash, role.requires_password]);
    }

    // Create user_sessions table for session management
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        role_name VARCHAR(50) NOT NULL,
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_management_audit (
        id SERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        role_name VARCHAR(50),
        changed_by VARCHAR(50),
        change_details JSONB,
        ip_address INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ User management tables created successfully!');
    
    // Add indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_role_name ON user_management_audit(role_name)');
    
    console.log('✅ User management indexes created successfully!');

  } catch (error) {
    console.error('❌ Error creating user management tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createUserManagementTables };

// Run if called directly
if (require.main === module) {
  createUserManagementTables()
    .then(() => {
      console.log('✅ User management setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User management setup failed:', error);
      process.exit(1);
    });
}