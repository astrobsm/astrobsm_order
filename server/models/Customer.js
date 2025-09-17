const pool = require('../database/db');

class Customer {
    static async create(customerData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            console.log('Creating/finding customer with data:', customerData);
            
            const email = customerData.customerEmail || customerData.email || '';
            const name = customerData.customerName || customerData.name || 'Unknown Customer';
            const phone = customerData.customerPhone || customerData.phone || '';
            const address = customerData.customerAddress || customerData.address || customerData.delivery_address || '';
            
            // First, try to find existing customer by email (if email is provided)
            if (email) {
                const findQuery = `SELECT id, name, email, phone, delivery_address FROM customers WHERE email = $1`;
                const findResult = await client.query(findQuery, [email]);
                
                if (findResult.rows.length > 0) {
                    console.log('✅ Found existing customer:', findResult.rows[0]);
                    await client.query('COMMIT');
                    return findResult.rows[0];
                }
            }
            
            // If no existing customer found, create new one
            const customerQuery = `
                INSERT INTO customers (name, email, phone, delivery_address) 
                VALUES ($1, $2, $3, $4) 
                RETURNING id, name, email, phone, delivery_address`;
            
            const customerValues = [name, email, phone, address];
            
            console.log('Inserting new customer with values:', customerValues);
            
            const customerResult = await client.query(customerQuery, customerValues);
            await client.query('COMMIT');
            
            console.log('✅ Customer created successfully:', customerResult.rows[0]);
            return customerResult.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error creating customer:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    static async getAll() {
        const client = await pool.connect();
        try {
            console.log('📋 Fetching all customers...');
            
            const result = await client.query('SELECT * FROM customers ORDER BY created_at DESC');
            console.log(`✅ Found ${result.rows.length} customers`);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error fetching customers:', error);
            return [];
        } finally {
            client.release();
        }
    }
    
    static async getById(id) {
        const client = await pool.connect();
        try {
            console.log('🔍 Fetching customer by ID:', id);
            
            const result = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                console.log('❌ Customer not found with ID:', id);
                return null;
            }
            
            console.log('✅ Customer found:', result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error fetching customer by ID:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    static async getByCustomerId(customerId) {
        const client = await pool.connect();
        try {
            console.log('🔍 Fetching customer by customer_id:', customerId);
            
            const result = await client.query('SELECT * FROM customers WHERE customer_id = $1', [customerId]);
            
            if (result.rows.length === 0) {
                console.log('❌ Customer not found with customer_id:', customerId);
                return null;
            }
            
            console.log('✅ Customer found:', result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error fetching customer by customer_id:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async findByEmail(email) {
        if (!email) return null;
        
        console.log('🔍 Looking up customer by email:', email);
        
        try {
            const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
            console.log('✅ Email lookup successful, found:', result.rows.length, 'customers');
            return result.rows[0];
        } catch (error) {
            if (error.message.includes('column "email"') && error.message.includes('does not exist')) {
                console.log('📝 Email column not found, skipping email lookup...');
                return null;
            }
            console.error('❌ Customer email lookup error:', error.message);
            return null;
        }
    }
    
    static async findById(id) {
        return this.getById(id);
    }
}

module.exports = Customer;
