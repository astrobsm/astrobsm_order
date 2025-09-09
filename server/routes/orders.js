const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received order submission:', JSON.stringify(req.body, null, 2));
    
    const { customerData, orderData, items, total } = req.body;
    
    // Validate required data
    if (!customerData || !orderData || !items || !Array.isArray(items)) {
      console.error('❌ Invalid request data structure');
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: 'Missing customerData, orderData, or items array' 
      });
    }
    
    if (items.length === 0) {
      console.error('❌ No items in order');
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: 'No items in order' 
      });
    }
    
    console.log('👤 Processing customer...');
    
    // Check if customer exists or create new one
    let customer = null;
    if (customerData.email) {
      customer = await Customer.findByEmail(customerData.email);
    }
    
    if (!customer) {
      customer = await Customer.create(customerData);
      console.log('✅ Created new customer:', customer.id);
    } else {
      console.log('✅ Found existing customer:', customer.id);
    }
    
    console.log('📝 Creating order with items:', items.length);
    
    // Create order (include delivery_address from customerData)
    const order = await Order.create({
      customer_id: customer.id,
      delivery_date: orderData.delivery_date,
      delivery_route: orderData.delivery_route,
      preferred_delivery_method: orderData.preferred_delivery_method,
      request_status: orderData.request_status,
      delivery_address: customerData.delivery_address, // ✅ Move delivery_address to orders
      items: items
    });
    
    console.log('✅ Order created successfully:', order.id);
    
    res.status(201).json({
      message: 'Order created successfully',
      order: order,
      customer: customer
    });
    
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    console.error('📋 Error stack:', error.stack);
    
    // Return more detailed error information
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
    console.log('Fetching all orders...');
    const orders = await Order.getAll();
    console.log('Orders fetched successfully:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // Check if it's a table not found error
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('Orders table does not exist, returning empty array');
      res.json([]);
    } else {
      res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
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

module.exports = router;
