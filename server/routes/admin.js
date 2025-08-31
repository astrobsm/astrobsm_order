const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products for admin management
router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products for admin:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add new product (admin only)
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, stock_quantity, adminPassword } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock_quantity: stock_quantity || 100
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Product with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add product' });
    }
  }
});

// Update product (admin only)
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, adminPassword, pricePassword } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // If price is being updated, verify additional password
    const currentProduct = await Product.findById(id);
    if (price !== undefined && price !== currentProduct.price) {
      if (pricePassword !== 'redvelvet') {
        return res.status(401).json({ error: 'Price editing requires additional authorization' });
      }
    }

    const updatedProduct = await Product.update(id, {
      name,
      description,
      price,
      stock_quantity
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const deleted = await Product.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
