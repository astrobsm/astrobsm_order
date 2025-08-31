const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all products...');
    const products = await Product.getAll();
    console.log('Products fetched successfully:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Check if it's a table not found error
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('Products table does not exist, returning empty array');
      res.json([]);
    } else {
      res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
