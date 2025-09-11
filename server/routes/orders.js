const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const { customerData, orderData, items } = req.body;
    
    // For now, always create a new customer since email lookup may fail
    // TODO: Implement proper customer lookup by phone or other unique identifier
    let customer = await Customer.create(customerData);
    
    // Create order
    const order = await Order.create({
      customer_id: customer.id,
      delivery_date: orderData.delivery_date,
      delivery_route: orderData.delivery_route,
      preferred_delivery_method: orderData.preferred_delivery_method,
      request_status: orderData.request_status,
      items: items
    });
    
    res.status(201).json({
      message: 'Order created successfully',
      order: order,
      customer: customer
    });
    
  } catch (error) {
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

module.exports = router;
