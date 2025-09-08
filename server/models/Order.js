const pool = require('../database/db');

class Order {
  static async create(orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status, items } = orderData;
      
      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status]
      );
      
      const order = orderResult.rows[0];
      let subtotal = 0;
      
      // Create order items
      for (const item of items) {
        console.log('🔍 Looking for product:', item.product_name);
        // Try exact match first, then case-insensitive match
        let productResult = await client.query('SELECT * FROM products WHERE name = $1', [item.product_name]);
        
        if (productResult.rows.length === 0) {
          console.log('⚠️ Exact match failed, trying case-insensitive...');
          productResult = await client.query('SELECT * FROM products WHERE name ILIKE $1', [item.product_name]);
        }
        
        console.log('📦 Found products:', productResult.rows.length);
        const product = productResult.rows[0];
        
        if (!product) {
          console.error('❌ Product not found:', item.product_name);
          // Try to find similar products for debugging
          const similarResult = await client.query('SELECT name FROM products WHERE name ILIKE $1 LIMIT 5', [`%${item.product_name.split(' ')[0]}%`]);
          console.log('🔄 Similar products:', similarResult.rows.map(p => p.name));
          throw new Error(`Product not found: ${item.product_name}`);
        }
        
        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;
        
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [order.id, product.id, item.quantity, product.price, itemSubtotal]
        );
      }
      
      // Calculate VAT (2.5%)
      const vatAmount = subtotal * 0.025;
      const totalAmount = subtotal + vatAmount;
      
      // Update order with subtotal, VAT, and total
      await client.query(
        'UPDATE orders SET subtotal = $1, vat_amount = $2, total_amount = $3 WHERE id = $4',
        [subtotal, vatAmount, totalAmount, order.id]
      );
      
      await client.query('COMMIT');
      
      return { ...order, subtotal, vat_amount: vatAmount, total_amount: totalAmount };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT o.*, c.name as customer_name, c.email, c.phone, c.address, c.hospital_name
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      WHERE o.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getOrderItems(orderId) {
    const result = await pool.query(`
      SELECT oi.*, p.name as product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = $1
    `, [orderId]);
    return result.rows;
  }

  static async getAll() {
    const result = await pool.query(`
      SELECT o.*, c.name as customer_name, c.email, c.phone, c.address, c.hospital_name
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.created_at DESC
    `);
    return result.rows;
  }
}

module.exports = Order;
