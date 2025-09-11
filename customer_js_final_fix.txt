// COMPLETE FIX - Customer.js with correct database path
// Copy this entire content and replace the existing Customer.js file via GitHub

const pool = require('../database/db');

class Customer {
    static async create(customerData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Generate unique customer_id (required by production schema)
            const customerId = 'CUST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            
            // Production schema: id, name, customer_id (NOT NULL), phone, address, company
            const customerQuery = `
                INSERT INTO customers (name, customer_id, phone, address, company) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING id, name, customer_id, phone, address, company`;
            
            const customerValues = [
                customerData.customerName || customerData.name,
                customerId,  // Always provide unique customer_id
                customerData.customerPhone || customerData.phone,
                customerData.customerAddress || customerData.address,
                customerData.customerCompany || customerData.company
            ];
            
            const customerResult = await client.query(customerQuery, customerValues);
            await client.query('COMMIT');
            
            return customerResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating customer:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    static async getAll() {
        const client = await pool.connect();
        try {
            // Handle both schema variants for compatibility
            let query = 'SELECT * FROM customers ORDER BY id DESC';
            
            // First, check what columns exist
            const schemaQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'customers' 
                ORDER BY ordinal_position`;
            
            const schemaResult = await client.query(schemaQuery);
            const columns = schemaResult.rows.map(row => row.column_name);
            
            console.log('Customer table columns:', columns);
            
            // Adjust query based on available columns
            if (columns.includes('customer_id')) {
                query = 'SELECT id, name, customer_id, phone, address, company FROM customers ORDER BY id DESC';
            }
            
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching customers:', error);
            
            // Fallback: try basic query
            try {
                const fallbackResult = await client.query('SELECT * FROM customers LIMIT 10');
                return fallbackResult.rows;
            } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
                return [];
            }
        } finally {
            client.release();
        }
    }
    
    static async getById(id) {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching customer by ID:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Customer;
