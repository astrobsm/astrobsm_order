const pool = require('../database/db');

class Order {
  static async create(orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status, items } = orderData;
      
      // Enhanced validation logging
      console.log('🔍 Order creation started:', {
        customer_id,
        delivery_date,
        delivery_route,
        preferred_delivery_method,
        request_status,
        items_count: items?.length || 0
      });
      
      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status]
      );
      
      const order = orderResult.rows[0];
      console.log('✅ Order created with ID:', order.id);
      
      let subtotal = 0;
      
      // Create order items with proper validation
      for (const item of items) {
        console.log('🔍 Processing item:', item.product_name);
        
        const productResult = await client.query('SELECT * FROM products WHERE name = $1', [item.product_name]);
        
        if (!productResult.rows || productResult.rows.length === 0) {
          console.error('❌ Product not found:', item.product_name);
          throw new Error(`Product not found: ${item.product_name}`);
        }
        
        const product = productResult.rows[0];
        console.log('📋 Product found:', { id: product.id, name: product.name, price: product.price });
        
        const unitPrice = parseFloat(product.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        
        console.log('🔢 Parsed values:', { unitPrice, quantity });
        
        if (unitPrice <= 0) {
          console.error('❌ Invalid price for product:', item.product_name, 'Price:', unitPrice);
          throw new Error(`Invalid price for product: ${item.product_name}`);
        }
        
        if (quantity <= 0) {
          console.error('❌ Invalid quantity for product:', item.product_name, 'Quantity:', quantity);
          throw new Error(`Invalid quantity for product: ${item.product_name}`);
        }
        
        const itemSubtotal = unitPrice * quantity;
        subtotal += itemSubtotal;
        
        console.log('💰 Item subtotal:', itemSubtotal);
        
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [order.id, product.id, quantity, unitPrice, itemSubtotal]
        );
        
        console.log('✅ Order item created for product:', product.name);
      }
      
      // Calculate VAT (2.5%)
      const vatAmount = subtotal * 0.025;
      const totalAmount = subtotal + vatAmount;
      
      console.log('💰 Final calculations:', { subtotal, vatAmount, totalAmount });
      
      // Update order with subtotal, VAT, and total
      await client.query(
        'UPDATE orders SET subtotal = $1, vat_amount = $2, total_amount = $3 WHERE id = $4',
        [subtotal, vatAmount, totalAmount, order.id]
      );
      
      await client.query('COMMIT');
      
      console.log('🎉 Order creation completed successfully:', order.id);
      
      return { ...order, subtotal, vat_amount: vatAmount, total_amount: totalAmount };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating order:', error.message);
      console.error('📋 Error stack:', error.stack);
      console.error('📋 Order data that failed:', JSON.stringify(orderData, null, 2));
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
