// Production Authentication Fix Script
// This script should be run on the production server to ensure proper password hashes

const bcrypt = require('bcryptjs');
const pool = require('./server/database/db');

async function fixProductionAuthentication() {
    console.log('🔧 Starting production authentication fix...');
    
    try {
        const client = await pool.connect();
        
        try {
            // Check current password status
            console.log('📊 Checking current password status...');
            const statusResult = await client.query(`
                SELECT role_name, requires_password, 
                       password_hash IS NOT NULL as has_hash
                FROM user_roles 
                WHERE is_active = true 
                ORDER BY role_name
            `);
            
            console.log('Current status:');
            statusResult.rows.forEach(row => {
                console.log(`  ${row.role_name}: requires_password=${row.requires_password}, has_hash=${row.has_hash}`);
            });
            
            // Define the correct passwords for each role
            const rolePasswords = {
                sales_staff: 'pinkpetals',
                superadmin: 'natiss2024'
            };
            
            // Update password hashes if they're missing or need to be refreshed
            for (const [role, password] of Object.entries(rolePasswords)) {
                console.log(`🔑 Processing role: ${role}`);
                
                // Check if role exists
                const roleCheck = await client.query(
                    'SELECT id, password_hash FROM user_roles WHERE role_name = $1 AND is_active = true',
                    [role]
                );
                
                if (roleCheck.rows.length === 0) {
                    console.log(`❌ Role ${role} not found, skipping...`);
                    continue;
                }
                
                // Generate new password hash
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                console.log(`🔐 Generated new hash for ${role}: ${hashedPassword.substring(0, 20)}...`);
                
                // Update the password hash
                await client.query(
                    'UPDATE user_roles SET password_hash = $1 WHERE role_name = $2',
                    [hashedPassword, role]
                );
                
                console.log(`✅ Updated password hash for ${role}`);
                
                // Verify the new hash works
                const testResult = await bcrypt.compare(password, hashedPassword);
                console.log(`🧪 Password verification test for ${role}: ${testResult ? '✅ PASS' : '❌ FAIL'}`);
            }
            
            // Final status check
            console.log('\n📊 Final password status:');
            const finalStatusResult = await client.query(`
                SELECT role_name, requires_password, 
                       password_hash IS NOT NULL as has_hash,
                       LEFT(password_hash, 10) as hash_preview
                FROM user_roles 
                WHERE is_active = true 
                ORDER BY role_name
            `);
            
            finalStatusResult.rows.forEach(row => {
                console.log(`  ${row.role_name}: requires_password=${row.requires_password}, has_hash=${row.has_hash}, hash_preview=${row.hash_preview || 'null'}`);
            });
            
            console.log('\n✅ Production authentication fix completed successfully!');
            
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error during production authentication fix:', error);
        throw error;
    }
}

async function testAuthentication() {
    console.log('\n🧪 Testing authentication after fix...');
    
    const testCases = [
        { role: 'customer', password: null },
        { role: 'sales_staff', password: 'pinkpetals' },
        { role: 'superadmin', password: 'natiss2024' }
    ];
    
    try {
        const client = await pool.connect();
        
        try {
            for (const testCase of testCases) {
                console.log(`\n🔍 Testing ${testCase.role}...`);
                
                const result = await client.query(`
                    SELECT role_name, password_hash, requires_password
                    FROM user_roles 
                    WHERE role_name = $1 AND is_active = true
                `, [testCase.role]);
                
                if (result.rows.length === 0) {
                    console.log(`❌ Role ${testCase.role} not found`);
                    continue;
                }
                
                const role = result.rows[0];
                
                if (role.requires_password) {
                    if (!testCase.password) {
                        console.log(`❌ ${testCase.role} requires password but none provided`);
                        continue;
                    }
                    
                    const isValid = await bcrypt.compare(testCase.password, role.password_hash);
                    console.log(`🔐 Password verification for ${testCase.role}: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
                } else {
                    console.log(`✅ ${testCase.role} does not require password - OK`);
                }
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error during authentication testing:', error);
    }
}

// Run the fix
if (require.main === module) {
    fixProductionAuthentication()
        .then(() => testAuthentication())
        .then(() => {
            console.log('\n🎉 All done! Production authentication should now be working.');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    fixProductionAuthentication,
    testAuthentication
};