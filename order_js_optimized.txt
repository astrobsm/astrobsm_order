// OPTIMIZED Order.js model with correct schema and error handling

const pool = require('../database/db');
const Customer = require('./Customer');

class Order {
    static async create(orderData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            console.log('Creating order with data:', orderData);
            
            // Create customer first
            const customer = await Customer.create({
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                customerAddress: orderData.customerAddress,
                customerCompany: orderData.customerCompany
            });
            
            console.log('Customer created for order:', customer);
            
            // Calculate total amount
            let totalAmount = 0;
            if (orderData.items && Array.isArray(orderData.items)) {
                totalAmount = orderData.items.reduce((sum, item) => {
                    const itemPrice = parseFloat(item.price || 0);
                    const itemQuantity = parseInt(item.quantity || 1);
                    return sum + (itemPrice * itemQuantity);
                }, 0);
            }
            
            console.log('Calculated total amount:', totalAmount);
            
            // Create order
            const orderQuery = `
                INSERT INTO orders (customer_id, total_amount, status) 
                VALUES ($1, $2, $3) 
                RETURNING id, customer_id, total_amount, status, created_at`;
            
            const orderResult = await client.query(orderQuery, [
                customer.id,
                totalAmount,
                'pending'
            ]);
            
            const order = orderResult.rows[0];
            console.log('Order created:', order);
            
            // Create order items
            if (orderData.items && Array.isArray(orderData.items)) {
                for (const item of orderData.items) {
                    const itemPrice = parseFloat(item.price || 0);
                    const itemQuantity = parseInt(item.quantity || 1);
                    const subtotal = itemPrice * itemQuantity;
                    
                    // Find product ID by name
                    const productQuery = 'SELECT id FROM products WHERE name = $1';
                    const productResult = await client.query(productQuery, [item.name]);
                    
                    const productId = productResult.rows.length > 0 ? productResult.rows[0].id : null;
                    
                    const itemQuery = `
                        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal) 
                        VALUES ($1, $2, $3, $4, $5, $6)`;
                    
                    await client.query(itemQuery, [
                        order.id,
                        productId,
                        item.name,
                        itemQuantity,
                        itemPrice,
                        subtotal
                    ]);
                    
                    console.log(`Order item created: ${item.name} x${itemQuantity} = ₦${subtotal}`);
                }
            }
            
            await client.query('COMMIT');
            
            console.log('Order creation completed successfully');
            
            // Return complete order with customer info
            return {
                orderId: order.id,
                customerId: customer.id,
                customerInfo: customer,
                totalAmount: order.total_amount,
                status: order.status,
                createdAt: order.created_at,
                items: orderData.items
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating order:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    static async getAll() {
        const client = await pool.connect();
        try {
            console.log('Fetching all orders with customer and item details...');
            
            const ordersQuery = `
                SELECT 
                    o.id,
                    o.total_amount,
                    o.status,
                    o.created_at,
                    c.name as customer_name,
                    c.customer_id,
                    c.phone as customer_phone,
                    c.address as customer_address,
                    c.company as customer_company
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC`;
            
            const ordersResult = await client.query(ordersQuery);
            
            console.log(`Found ${ordersResult.rows.length} orders`);
            
            // Get items for each order
            const ordersWithItems = [];
            for (const order of ordersResult.rows) {
                const itemsQuery = `
                    SELECT 
                        oi.product_name,
                        oi.quantity,
                        oi.price,
                        oi.subtotal,
                        p.description
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = $1`;
                
                const itemsResult = await client.query(itemsQuery, [order.id]);
                
                ordersWithItems.push({
                    ...order,
                    items: itemsResult.rows
                });
            }
            
            console.log('Orders with items fetched successfully');
            return ordersWithItems;
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        } finally {
            client.release();
        }
    }
    
    static async getById(orderId) {
        const client = await pool.connect();
        try {
            console.log('Fetching order by ID:', orderId);
            
            const orderQuery = `
                SELECT 
                    o.id,
                    o.total_amount,
                    o.status,
                    o.created_at,
                    c.name as customer_name,
                    c.customer_id,
                    c.phone as customer_phone,
                    c.address as customer_address,
                    c.company as customer_company
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                WHERE o.id = $1`;
            
            const orderResult = await client.query(orderQuery, [orderId]);
            
            if (orderResult.rows.length === 0) {
                console.log('Order not found with ID:', orderId);
                return null;
            }
            
            const order = orderResult.rows[0];
            
            // Get order items
            const itemsQuery = `
                SELECT 
                    oi.product_name,
                    oi.quantity,
                    oi.price,
                    oi.subtotal,
                    p.description
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = $1`;
            
            const itemsResult = await client.query(itemsQuery, [orderId]);
            
            const completeOrder = {
                ...order,
                items: itemsResult.rows
            };
            
            console.log('Order found:', completeOrder);
            return completeOrder;
            
        } catch (error) {
            console.error('Error fetching order by ID:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Order;
