const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const { customerData, orderData, items } = req.body;
    
    // Check if customer exists or create new one
    let customer = null;
    if (customerData.email) {
      customer = await Customer.findByEmail(customerData.email);
    }
    
    if (!customer) {
      customer = await Customer.create(customerData);
    }
    
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
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
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
