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
    
    // Step 1: Validate stock availability
    const stockIssues = [];
    for (const item of items) {
      const stockCheck = await client.query(`
        SELECT 
          p.name, 
          COALESCE(si.current_stock, p.stock_quantity, 0) as current_stock
        FROM products p
        LEFT JOIN stock_inventory si ON p.id = si.product_id
        WHERE p.id = $1
      `, [item.product_id]);
      
      if (stockCheck.rows.length === 0) {
        stockIssues.push(`Product ID ${item.product_id} not found`);
        continue;
      }
      
      const { name, current_stock } = stockCheck.rows[0];
      if (current_stock < item.quantity) {
        stockIssues.push(`Insufficient stock for ${name}. Available: ${current_stock}, Requested: ${item.quantity}`);
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
      items: items
    });
    
    // Step 4: Deduct stock for each item
    const stockUpdates = [];
    for (const item of items) {
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

module.exports = router;
