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
        
        // Add product_name if the column exists (critical for production)
        if (orderItemsColumns.includes('product_name')) {
          itemColumnsToInsert.push('product_name');
          itemValuesToInsert.push(product.name);
        }
        
        // Add optional columns if they exist
        if (orderItemsColumns.includes('unit_price')) {
          itemColumnsToInsert.push('unit_price');
          itemValuesToInsert.push(price);
        } else if (orderItemsColumns.includes('price')) {
          // Some schemas use 'price' instead of 'unit_price'
          itemColumnsToInsert.push('price');
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
      console.log(`🔍 Finding order by ID: ${id}`);
      
      // Fallback approach - try simple query first, then try JOIN
      let order;
      
      try {
        // First try the basic order without JOIN
        const basicOrderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        
        if (!basicOrderResult.rows || basicOrderResult.rows.length === 0) {
          console.log(`❌ Order ${id} not found`);
          return null;
        }
        
        order = basicOrderResult.rows[0];
        console.log(`✅ Found basic order ${id}`);
        
        // Try to get customer data if customer_id exists
        if (order.customer_id) {
          try {
            const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [order.customer_id]);
            if (customerResult.rows && customerResult.rows.length > 0) {
              const customer = customerResult.rows[0];
              order.customer_name = customer.name || 'Unknown Customer';
              order.phone = customer.phone || '';
              order.email = customer.email || '';
              order.address = customer.delivery_address || customer.address || '';
              console.log(`✅ Found customer data: ${order.customer_name}`);
            } else {
              order.customer_name = 'Unknown Customer';
              order.phone = '';
              order.email = '';
              order.address = '';
              console.log(`⚠️ Customer ${order.customer_id} not found`);
            }
          } catch (customerError) {
            console.warn(`⚠️ Error fetching customer for order ${id}:`, customerError.message);
            order.customer_name = 'Unknown Customer';
            order.phone = '';
            order.email = '';
            order.address = '';
          }
        } else {
          order.customer_name = 'Unknown Customer';
          order.phone = '';
          order.email = '';
          order.address = '';
          console.log(`⚠️ Order ${id} has no customer_id`);
        }
        
      } catch (orderError) {
        console.error(`❌ Error fetching basic order ${id}:`, orderError.message);
        throw orderError;
      }
      
      // Get order items (handle gracefully if missing)
      try {
        const itemsResult = await pool.query(`
          SELECT oi.*, 
                 COALESCE(p.name, oi.product_name, 'Unknown Product') as product_name
          FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id 
          WHERE oi.order_id = $1
        `, [id]);
        
        order.items = itemsResult.rows || [];
        console.log(`✅ Found ${order.items.length} items for order ${id}`);
      } catch (itemsError) {
        console.warn(`⚠️ Error fetching items for order ${id}:`, itemsError.message);
        order.items = [];
      }
      
      return order;
    } catch (error) {
      console.error(`❌ Error fetching order by ID ${id}:`, error.message, error.stack);
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
    console.log('🔍 Order.getAll() called - fetching orders...');
    
    try {
      // First, let's check if orders table has any data at all
      const countResult = await pool.query('SELECT COUNT(*) as count FROM orders');
      const orderCount = countResult.rows[0].count;
      console.log(`📊 Total orders in database: ${orderCount}`);
      
      if (orderCount === 0) {
        console.log('ℹ️ No orders in database');
        return [];
      }
      
      // Check if customers table exists and has data
      const customerCountResult = await pool.query('SELECT COUNT(*) as count FROM customers');
      const customerCount = customerCountResult.rows[0].count;
      console.log(`📊 Total customers in database: ${customerCount}`);
      
      // Try the simplest query first - just orders without JOIN
      console.log('🔄 Trying simple orders query first...');
      const simpleResult = await pool.query(`
        SELECT o.*, 'Loading...' as customer_name, '' as phone, '' as address
        FROM orders o 
        ORDER BY o.created_at DESC
        LIMIT 10
      `);
      console.log(`📊 Simple query found ${simpleResult.rows.length} orders`);
      
      if (simpleResult.rows.length > 0) {
        console.log('✅ Simple query works, now trying with customer data...');
        
        // Check what columns exist in the customers table
        const customersColumnsResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'customers' AND table_schema = 'public'
        `);
        const customerColumns = customersColumnsResult.rows.map(row => row.column_name);
        console.log('📋 Available customer columns:', customerColumns);
        
        // Build dynamic query based on available columns
        let addressColumn = 'NULL as address';
        if (customerColumns.includes('delivery_address')) {
          addressColumn = 'c.delivery_address as address';
        } else if (customerColumns.includes('address')) {
          addressColumn = 'c.address as address';
        }
        
        // Try the JOIN query
        const joinQuery = `
          SELECT o.*, 
                 COALESCE(c.name, 'Unknown Customer') as customer_name, 
                 COALESCE(c.phone, '') as phone, 
                 ${addressColumn}
          FROM orders o 
          LEFT JOIN customers c ON o.customer_id = c.id 
          ORDER BY o.created_at DESC
        `;
        
        console.log('📋 Trying JOIN query:', joinQuery);
        const joinResult = await pool.query(joinQuery);
        console.log(`📊 JOIN query found ${joinResult.rows.length} orders`);
        
        return joinResult.rows;
      } else {
        console.log('⚠️ Simple query returned no results despite count > 0');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error in Order.getAll():', error);
      console.error('SQL Error details:', error.message);
      
      // Final fallback - return empty array but log the issue
      console.log('🔄 All queries failed, returning empty array');
      return [];
    }
  }
}

module.exports = Order;
