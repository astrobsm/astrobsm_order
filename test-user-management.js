// Test script for User Management functionality
const API_BASE_URL = 'http://localhost:3000/api';

async function testUserCreation() {
    console.log('🧪 Testing User Management functionality...');
    
    try {
        // Test 1: List existing users
        console.log('\n1️⃣ Testing user list retrieval...');
        const listResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'list', 
                userRole: 'superadmin' 
            })
        });
        
        const listResult = await listResponse.json();
        console.log('✅ User list response:', listResult);
        
        if (listResult.success) {
            console.log(`📊 Found ${listResult.roles.length} existing users`);
            listResult.roles.forEach(role => {
                console.log(`   - ${role.role_display_name} (${role.role_name})`);
            });
        } else {
            console.log('❌ Failed to load users:', listResult.error);
            return;
        }
        
        // Test 2: Create a test user
        console.log('\n2️⃣ Testing user creation...');
        const testUserData = {
            role_name: 'test_manager',
            role_display_name: 'Test Manager',
            description: 'Test role for validation',
            password: 'test123',
            permissions: ['place_orders', 'view_products', 'view_all_orders'],
            requires_password: true,
            userRole: 'superadmin'
        };
        
        const createResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUserData)
        });
        
        const createResult = await createResponse.json();
        console.log('✅ User creation response:', createResult);
        
        if (createResult.success) {
            console.log('🎉 User created successfully!');
            console.log('   New user:', createResult.role);
            
            // Test 3: Clean up - delete the test user
            console.log('\n3️⃣ Testing user deletion...');
            const deleteResponse = await fetch(`${API_BASE_URL}/users/${createResult.role.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userRole: 'superadmin' })
            });
            
            const deleteResult = await deleteResponse.json();
            console.log('✅ User deletion response:', deleteResult);
            
            if (deleteResult.success) {
                console.log('🗑️ Test user deleted successfully!');
            } else {
                console.log('⚠️ Failed to delete test user:', deleteResult.error);
            }
        } else {
            console.log('❌ Failed to create user:', createResult.error);
        }
        
    } catch (error) {
        console.error('💥 Test failed with error:', error);
    }
}

// Run the test
testUserCreation();