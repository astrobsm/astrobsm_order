const pool = require('../database/db');

class Order {
  static async create(orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status, items } = orderData;
      
      // Create order with basic fields that likely exist
      const orderResult = await client.query(
        'INSERT INTO orders (customer_id) VALUES ($1) RETURNING *',
        [customer_id]
      );
      
      const order = orderResult.rows[0];
      
      // Create order items with minimal validation
      for (const item of items) {
        const productResult = await client.query('SELECT * FROM products WHERE name = $1', [item.product_name]);
        
        if (!productResult.rows || productResult.rows.length === 0) {
          throw new Error(`Product not found: ${item.product_name}`);
        }
        
        const product = productResult.rows[0];
        const quantity = parseInt(item.quantity) || 0;
        
        console.log('📦 Product found:', product);
        console.log('💰 Product price:', product.price, 'Type:', typeof product.price);
        
        if (quantity <= 0) {
          throw new Error(`Invalid quantity for product: ${item.product_name}`);
        }
        
        // Ensure price is a valid number
        const price = parseFloat(product.price) || 0;
        console.log('💰 Final price:', price);
        
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, product_name, price) VALUES ($1, $2, $3, $4, $5)',
          [order.id, product.id, quantity, product.name, price]
        );
      }
      
      await client.query('COMMIT');
      
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    try {
      const orderResult = await pool.query(`
        SELECT o.*, c.name as customer_name, c.email, c.phone, c.delivery_address, c.company
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = $1
      `, [id]);
      
      if (!orderResult.rows || orderResult.rows.length === 0) {
        return null;
      }
      
      const order = orderResult.rows[0];
      
      // Get order items
      const itemsResult = await pool.query(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
      `, [id]);
      
      order.items = itemsResult.rows;
      return order;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  static async getOrderItems(orderId) {
    try {
      const result = await pool.query(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
      `, [orderId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
  }

  static async getAll() {
    try {
      const result = await pool.query(`
        SELECT o.*, c.name as customer_name, c.email, c.phone, c.delivery_address, c.company
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }
}

module.exports = Order;
