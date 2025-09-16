const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
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

// Create new product
router.post('/', async (req, res) => {
  try {
    const { name, unit_price, description } = req.body;
    
    if (!name || !unit_price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }
    
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(unit_price),
      stock_quantity: 0 // Default stock quantity for new products
    };
    
    const product = await Product.create(productData);
    console.log('Product created:', product);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create product', 
      details: error.message 
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit_price, description } = req.body;
    
    if (!name || !unit_price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }
    
    // First check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(unit_price),
      stock_quantity: existingProduct.stock_quantity // Preserve existing stock
    };
    
    const product = await Product.update(id, productData);
    console.log('Product updated:', product);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update product', 
      details: error.message 
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await Product.delete(id);
    console.log('Product deleted:', id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product', 
      details: error.message 
    });
  }
});

module.exports = router;
