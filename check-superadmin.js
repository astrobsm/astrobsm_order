// Check superadmin permissions in database
const pool = require('./server/database/db');

async function checkSuperadminPermissions() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Checking superadmin permissions...');
    const result = await client.query('SELECT role_name, permissions FROM user_roles WHERE role_name = $1', ['superadmin']);
    
    if (result.rows.length > 0) {
      console.log('✅ Superadmin role found:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      
      const permissions = result.rows[0].permissions;
      console.log('🔍 Has manage_stock permission?', permissions.includes('manage_stock'));
    } else {
      console.log('❌ Superadmin role not found in database');
      
      // Check what roles exist
      const allRoles = await client.query('SELECT role_name FROM user_roles');
      console.log('📋 Available roles:', allRoles.rows.map(r => r.role_name));
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkSuperadminPermissions();