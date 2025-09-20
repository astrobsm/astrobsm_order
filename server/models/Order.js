const pool = require('../database/db');

class Order {
  static async create(orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customer_id, delivery_date, delivery_route, preferred_delivery_method, request_status, items } = orderData;
      
      // Check what columns exist in the orders table
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND table_schema = 'public'
      `);
      const availableColumns = columnsResult.rows.map(row => row.column_name);
      console.log('📋 Available orders columns:', availableColumns);
      
      // Build dynamic INSERT based on available columns
      const columnsToInsert = ['customer_id'];
      const valuesToInsert = [customer_id];
      let paramIndex = 1;
      
      // Add all optional columns including request_status
      const optionalData = { 
        request_status: request_status || 'pending',
        delivery_date, 
        delivery_route, 
        preferred_delivery_method 
      };
      
      // Add optional columns if they exist in the table
      Object.entries(optionalData).forEach(([key, value]) => {
        if (availableColumns.includes(key) && value !== undefined && value !== null) {
          columnsToInsert.push(key);
          valuesToInsert.push(value);
          paramIndex++;
        }
      });
      
      const insertSQL = `INSERT INTO orders (${columnsToInsert.join(', ')}) VALUES (${columnsToInsert.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
      console.log('📋 Order INSERT SQL:', insertSQL, 'Values:', valuesToInsert);
      
      const orderResult = await client.query(insertSQL, valuesToInsert);
      
      const order = orderResult.rows[0];
      let orderSubtotal = 0;
      
      // Get available columns for order_items table
      const orderItemsColumnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' AND table_schema = 'public'
      `);
      const orderItemsColumns = orderItemsColumnsResult.rows.map(row => row.column_name);
      console.log('📋 Available order_items columns:', orderItemsColumns);

      // Create order items and calculate totals
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
        const itemSubtotal = price * quantity;
        orderSubtotal += itemSubtotal;
        console.log('💰 Final price:', price, 'Quantity:', quantity, 'Item Subtotal:', itemSubtotal, 'Order Subtotal:', orderSubtotal);
        console.log('🔄 About to insert order item with subtotal:', itemSubtotal);
        
        // Build dynamic INSERT for order_items based on available columns
        const itemColumnsToInsert = ['order_id', 'product_id', 'quantity'];
        const itemValuesToInsert = [order.id, product.id, quantity];
        
        // Add optional columns if they exist
        if (orderItemsColumns.includes('unit_price')) {
          itemColumnsToInsert.push('unit_price');
          itemValuesToInsert.push(price);
        }
        if (orderItemsColumns.includes('subtotal')) {
          itemColumnsToInsert.push('subtotal');
          itemValuesToInsert.push(itemSubtotal);
        }
        
        const orderItemInsertSQL = `INSERT INTO order_items (${itemColumnsToInsert.join(', ')}) VALUES (${itemColumnsToInsert.map((_, i) => `$${i + 1}`).join(', ')})`;
        console.log('📋 Order Item INSERT SQL:', orderItemInsertSQL, 'Values:', itemValuesToInsert);
        
        await client.query(orderItemInsertSQL, itemValuesToInsert);
      }
      
      // Calculate VAT (2.5%) and total
      const vatAmount = orderSubtotal * 0.025;
      const totalAmount = orderSubtotal + vatAmount;
      
      // Note: Not updating orders table as it may not have these columns in production
      // The totals are calculated dynamically for the response
      
      await client.query('COMMIT');
      
      return { 
        ...order, 
        subtotal: orderSubtotal, 
        vat_amount: vatAmount, 
        total_amount: totalAmount 
      };
      
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
        SELECT o.*, c.name as customer_name, c.phone, c.delivery_address as address
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
        SELECT o.*, c.name as customer_name, c.phone, c.delivery_address as address
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      console.error('SQL Error details:', error.message);
      return [];
    }
  }
}

module.exports = Order;
