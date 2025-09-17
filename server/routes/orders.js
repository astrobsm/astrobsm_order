const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { updateProductStock } = require('../database/stock-setup');
const pool = require('../database/db');
const router = express.Router();

// Create new order with stock validation and deduction
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { customerData, orderData, items } = req.body;
    
    await client.query('BEGIN');
    
    // Step 1: Validate stock availability and get product IDs
    const stockIssues = [];
    const itemsWithIds = [];
    
    for (const item of items) {
      const stockCheck = await client.query(`
        SELECT 
          p.id,
          p.name, 
          COALESCE(si.current_stock, p.stock_quantity, 0) as current_stock
        FROM products p
        LEFT JOIN stock_inventory si ON p.id = si.product_id
        WHERE p.name = $1
      `, [item.product_name]);
      
      if (stockCheck.rows.length === 0) {
        stockIssues.push(`Product "${item.product_name}" not found`);
        continue;
      }
      
      const { id, name, current_stock } = stockCheck.rows[0];
      if (current_stock < item.quantity) {
        stockIssues.push(`Insufficient stock for ${name}. Available: ${current_stock}, Requested: ${item.quantity}`);
      } else {
        // Add product_id to item for later use
        itemsWithIds.push({
          ...item,
          product_id: id,
          product_name: name
        });
      }
    }
    
    // If there are stock issues, return error before creating order
    if (stockIssues.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Stock validation failed',
        issues: stockIssues,
        success: false
      });
    }
    
    // Step 2: Create customer
    let customer = await Customer.create(customerData);
    
    // Step 3: Create order
    const order = await Order.create({
      customer_id: customer.id,
      delivery_date: orderData.delivery_date,
      delivery_route: orderData.delivery_route,
      preferred_delivery_method: orderData.preferred_delivery_method,
      request_status: orderData.request_status,
      items: itemsWithIds
    });
    
    // Step 4: Deduct stock for each item
    const stockUpdates = [];
    for (const item of itemsWithIds) {
      const currentStockResult = await client.query(`
        SELECT COALESCE(si.current_stock, p.stock_quantity, 0) as current_stock, p.name
        FROM products p
        LEFT JOIN stock_inventory si ON p.id = si.product_id
        WHERE p.id = $1
      `, [item.product_id]);
      
      const { current_stock, name } = currentStockResult.rows[0];
      const newStock = current_stock - item.quantity;
      
      // Update stock using the stock management function
      const stockResult = await updateProductStock(
        item.product_id,
        newStock,
        `Stock deduction for order #${order.id}`,
        'ORDER',
        order.id
      );
      
      stockUpdates.push({
        product_name: name,
        quantity_deducted: item.quantity,
        previous_stock: current_stock,
        new_stock: newStock
      });
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Order created successfully with stock deduction',
      order: order,
      customer: customer,
      stock_updates: stockUpdates,
      success: true
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating order:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('📋 Request body received:', JSON.stringify(req.body, null, 2));
    console.error('📋 CustomerData keys:', Object.keys(req.body.customerData || {}));
    console.error('📋 OrderData keys:', Object.keys(req.body.orderData || {}));
    console.error('📋 Items count:', req.body.items ? req.body.items.length : 0);
    
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.getAll();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID with items
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const items = await Order.getOrderItems(req.params.id);
    res.json({ ...order, items });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Generate invoice and finalize stock deduction (if not already done)
router.post('/:id/invoice', async (req, res) => {
  const client = await pool.connect();
  try {
    const orderId = req.params.id;
    
    await client.query('BEGIN');
    
    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if stock has already been deducted for this order
    const stockMovementCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM stock_movements 
      WHERE reference_id = $1 AND reference_type = 'ORDER'
    `, [orderId]);
    
    const stockAlreadyDeducted = parseInt(stockMovementCheck.rows[0].count) > 0;
    
    if (!stockAlreadyDeducted) {
      // Deduct stock for invoice generation (fallback for old orders)
      const items = await Order.getOrderItems(orderId);
      const stockUpdates = [];
      
      for (const item of items) {
        const currentStockResult = await client.query(`
          SELECT COALESCE(si.current_stock, p.stock_quantity, 0) as current_stock, p.name
          FROM products p
          LEFT JOIN stock_inventory si ON p.id = si.product_id
          WHERE p.id = $1
        `, [item.product_id]);
        
        if (currentStockResult.rows.length > 0) {
          const { current_stock, name } = currentStockResult.rows[0];
          const newStock = Math.max(0, current_stock - item.quantity);
          
          await updateProductStock(
            item.product_id,
            newStock,
            `Stock deduction for invoice #${orderId}`,
            'INVOICE',
            orderId
          );
          
          stockUpdates.push({
            product_name: name,
            quantity_deducted: item.quantity,
            previous_stock: current_stock,
            new_stock: newStock
          });
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Invoice generated with stock deduction',
        order: order,
        stock_updates: stockUpdates,
        success: true
      });
    } else {
      await client.query('COMMIT');
      
      res.json({
        message: 'Invoice generated (stock already deducted)',
        order: order,
        success: true
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, orderId]
    );
    
    res.json({
      message: 'Order status updated successfully',
      success: true
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Failed to update order status', 
      details: error.message 
    });
  }
});

// Update order payment status and information
router.put('/:orderId/payment', async (req, res) => {
  let client;
  try {
    const { orderId } = req.params;
    const { 
      payment_status, 
      payment_method, 
      payment_reference, 
      payment_date, 
      payment_notes 
    } = req.body;
    
    console.log('Updating payment status for order:', orderId, req.body);
    
    // Get database client
    client = await pool.connect();
    
    // First check if the payment columns exist
    const columnsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public' 
      AND column_name IN ('payment_status', 'payment_method', 'payment_reference', 'payment_date', 'payment_notes')
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('Available payment columns:', existingColumns);
    
    if (existingColumns.length === 0) {
      // Payment columns don't exist yet, try to run migration
      console.log('⚠️ Payment columns not found, attempting migration...');
      const { runPaymentMigration } = require('../database/payment-migration');
      await runPaymentMigration();
      console.log('✅ Payment migration completed, retrying update...');
    }
    
    // Update order with payment information
    await client.query(`
      UPDATE orders 
      SET 
        payment_status = $1::varchar,
        payment_method = $2::varchar,
        payment_reference = $3::varchar,
        payment_date = $4::date,
        payment_notes = $5::text,
        status = CASE 
          WHEN $1::varchar = 'paid' THEN 'confirmed' 
          ELSE status 
        END
      WHERE id = $6::integer
    `, [payment_status, payment_method, payment_reference, payment_date, payment_notes, orderId]);
    
    // If payment is confirmed, create receipt record
    if (payment_status === 'paid') {
      const receiptNumber = `RCP-${orderId}-${Date.now().toString().slice(-6)}`;
      
      // Get order total for receipt
      const orderResult = await pool.query('SELECT total_amount FROM orders WHERE id = $1', [orderId]);
      const totalAmount = orderResult.rows[0]?.total_amount || 0;
      
      await pool.query(`
        INSERT INTO payment_receipts 
        (order_id, receipt_number, payment_method, payment_reference, amount_paid, payment_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (receipt_number) DO NOTHING
      `, [orderId, receiptNumber, payment_method, payment_reference, totalAmount, payment_date, payment_notes]);
      
      console.log('Payment receipt record created:', receiptNumber);
    }
    
    res.json({
      success: true,
      message: 'Payment information updated successfully',
      payment_status
    });
    
  } catch (error) {
    console.error('Error updating payment information:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update payment information', 
      details: error.message 
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Get payment receipts for an order
router.get('/:orderId/receipts', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM payment_receipts 
      WHERE order_id = $1 
      ORDER BY created_at DESC
    `, [orderId]);
    
    res.json({
      success: true,
      receipts: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching payment receipts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch payment receipts', 
      details: error.message 
    });
  }
});

// Mark receipt as generated
router.put('/:orderId/receipt-generated', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    await pool.query(`
      UPDATE orders 
      SET receipt_generated = true, receipt_generated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [orderId]);
    
    res.json({
      success: true,
      message: 'Receipt generation status updated'
    });
    
  } catch (error) {
    console.error('Error updating receipt status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update receipt status', 
      details: error.message 
    });
  }
});

module.exports = router;
