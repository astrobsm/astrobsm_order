const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { updateProductStock, checkLowStockAlert } = require('../database/stock-setup');

// Get all stock levels with product information
router.get('/levels', async (req, res) => {
  try {
    console.log('📊 Stock levels request received');
    
    // First check if the tables exist
    const tablesExist = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'stock_inventory' AND table_schema = 'public'
    `);
    
    if (parseInt(tablesExist.rows[0].count) === 0) {
      console.log('❌ stock_inventory table does not exist yet');
      return res.json({
        success: true,
        data: [],
        message: 'Stock inventory table not ready yet - deployment in progress'
      });
    }

    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        si.current_stock,
        si.reorder_level,
        si.max_stock_level,
        si.last_restocked,
        si.updated_at,
        CASE 
          WHEN si.current_stock = 0 THEN 'OUT_OF_STOCK'
          WHEN si.current_stock <= (si.reorder_level * 0.5) THEN 'CRITICAL'
          WHEN si.current_stock <= si.reorder_level THEN 'LOW'
          ELSE 'GOOD'
        END as stock_status
      FROM products p
      LEFT JOIN stock_inventory si ON p.id = si.product_id
      ORDER BY p.name
    `);

    console.log('✅ Stock levels query successful:', result.rows.length, 'products found');

    res.json({
      success: true,
      data: result.rows,
      message: 'Stock levels retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting stock levels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock levels',
      details: error.message
    });
  }
});

// Get stock level for specific product
router.get('/levels/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        si.current_stock,
        si.reorder_level,
        si.max_stock_level,
        si.last_restocked,
        si.updated_at,
        CASE 
          WHEN si.current_stock = 0 THEN 'OUT_OF_STOCK'
          WHEN si.current_stock <= (si.reorder_level * 0.5) THEN 'CRITICAL'
          WHEN si.current_stock <= si.reorder_level THEN 'LOW'
          ELSE 'GOOD'
        END as stock_status
      FROM products p
      LEFT JOIN stock_inventory si ON p.id = si.product_id
      WHERE p.id = $1
    `, [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product stock level retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting product stock level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve product stock level',
      details: error.message
    });
  }
});

// Add stock (stock intake)
router.post('/intake', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      product_id,
      quantity_added,
      cost_per_unit,
      supplier,
      batch_number,
      expiry_date,
      notes
    } = req.body;

    if (!product_id || !quantity_added || quantity_added <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and valid quantity are required'
      });
    }

    await client.query('BEGIN');

    // Get current stock
    const currentStockResult = await client.query(
      'SELECT current_stock FROM stock_inventory WHERE product_id = $1',
      [product_id]
    );

    if (currentStockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in stock inventory'
      });
    }

    const currentStock = currentStockResult.rows[0].current_stock;
    const newStock = currentStock + parseInt(quantity_added);
    const totalCost = cost_per_unit ? (cost_per_unit * quantity_added).toFixed(2) : null;

    // Insert stock intake record
    const intakeResult = await client.query(`
      INSERT INTO stock_intake (
        product_id, quantity_added, cost_per_unit, total_cost, 
        supplier, batch_number, expiry_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      product_id, quantity_added, cost_per_unit, totalCost,
      supplier, batch_number, expiry_date, notes
    ]);

    const intakeId = intakeResult.rows[0].id;

    // Update stock levels
    await client.query(`
      UPDATE stock_inventory 
      SET current_stock = $1, last_restocked = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $2
    `, [newStock, product_id]);

    // Update products table
    await client.query(`
      UPDATE products SET stock_quantity = $1 WHERE id = $2
    `, [newStock, product_id]);

    // Record stock movement
    await client.query(`
      INSERT INTO stock_movements (
        product_id, movement_type, quantity, reason, 
        previous_stock, new_stock, reference_type, reference_id
      ) VALUES ($1, 'IN', $2, $3, $4, $5, 'INTAKE', $6)
    `, [
      product_id, quantity_added, `Stock intake - ${supplier || 'Unknown supplier'}`,
      currentStock, newStock, intakeId
    ]);

    await client.query('COMMIT');

    // Get updated product info
    const productResult = await pool.query(
      'SELECT name FROM products WHERE id = $1',
      [product_id]
    );

    res.json({
      success: true,
      data: {
        intake_id: intakeId,
        product_name: productResult.rows[0]?.name,
        quantity_added,
        previous_stock: currentStock,
        new_stock: newStock,
        total_cost: totalCost
      },
      message: 'Stock intake recorded successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording stock intake:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record stock intake',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Update stock level directly (manual adjustment)
router.put('/adjust/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { new_stock, reason } = req.body;

    if (new_stock === undefined || new_stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid new stock level is required'
      });
    }

    const result = await updateProductStock(
      productId, 
      parseInt(new_stock), 
      reason || 'Manual adjustment',
      'ADJUSTMENT'
    );

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Stock level updated successfully'
      });
    } else {
      throw new Error('Stock update failed');
    }
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust stock level',
      details: error.message
    });
  }
});

// Update reorder level for a product
router.put('/reorder-level/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { reorder_level } = req.body;

    if (reorder_level === undefined || reorder_level < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid reorder level is required'
      });
    }

    await pool.query(`
      UPDATE stock_inventory 
      SET reorder_level = $1, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $2
    `, [reorder_level, productId]);

    // Check if this creates a low stock alert
    await checkLowStockAlert(productId);

    res.json({
      success: true,
      message: 'Reorder level updated successfully'
    });
  } catch (error) {
    console.error('Error updating reorder level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reorder level',
      details: error.message
    });
  }
});

// Get low stock alerts
router.get('/alerts', async (req, res) => {
  let client;
  try {
    console.log('🚨 Stock alerts request received:', req.query);
    
    // Defensive client acquisition
    try {
      client = await pool.connect();
    } catch (connError) {
      console.error('❌ Database connection failed for stock alerts:', connError);
      return res.json({
        success: true,
        data: [],
        message: 'Database temporarily unavailable - please try again shortly'
      });
    }
    
    // First check if the tables exist with better error handling
    let tablesExist;
    try {
      tablesExist = await client.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'low_stock_alerts' AND table_schema = 'public'
      `);
    } catch (tableError) {
      console.error('❌ Error checking table existence:', tableError);
      return res.json({
        success: true,
        data: [],
        message: 'Stock system initializing - please wait a moment'
      });
    }
    
    if (!tablesExist.rows || parseInt(tablesExist.rows[0].count) === 0) {
      console.log('❌ low_stock_alerts table does not exist yet');
      return res.json({
        success: true,
        data: [],
        message: 'Stock alerts table not ready yet - deployment in progress'
      });
    }
    
    const { acknowledged } = req.query;
    let whereClause = '';
    const params = [];
    
    if (acknowledged !== undefined) {
      whereClause = 'WHERE lsa.acknowledged = $1';
      params.push(acknowledged === 'true');
    }

    let result;
    try {
      result = await client.query(`
        SELECT 
          lsa.id,
          lsa.product_id,
          lsa.current_stock,
          lsa.reorder_level,
          lsa.alert_type,
          lsa.acknowledged,
          lsa.created_at,
          lsa.acknowledged_at,
          COALESCE(p.name, 'Unknown Product') as product_name,
          COALESCE(p.price, 0) as price,
          COALESCE(si.current_stock, 0) as actual_current_stock
        FROM low_stock_alerts lsa
        LEFT JOIN products p ON lsa.product_id = p.id
        LEFT JOIN stock_inventory si ON lsa.product_id = si.product_id
        ${whereClause}
        ORDER BY lsa.created_at DESC
      `, params);
    } catch (queryError) {
      console.error('❌ Error querying stock alerts:', queryError);
      return res.json({
        success: true,
        data: [],
        message: 'Unable to retrieve alerts at this time - system may be updating'
      });
    }

    console.log('✅ Stock alerts query successful:', result.rows.length, 'alerts found');

    res.json({
      success: true,
      data: result.rows || [],
      message: 'Stock alerts retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Unexpected error getting stock alerts:', error);
    res.json({
      success: true,
      data: [],
      error: 'Stock alerts temporarily unavailable',
      message: 'Please try refreshing in a few moments'
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('❌ Error releasing client:', releaseError);
      }
    }
  }
});

// Acknowledge stock alert
router.put('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledged_by } = req.body;

    await pool.query(`
      UPDATE low_stock_alerts 
      SET acknowledged = true, acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [acknowledged_by || 'admin', alertId]);

    res.json({
      success: true,
      message: 'Stock alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging stock alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge stock alert',
      details: error.message
    });
  }
});

// Get stock movement history
router.get('/movements/:productId?', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    let whereClause = '';
    const params = [parseInt(limit), parseInt(offset)];
    
    if (productId) {
      whereClause = 'WHERE sm.product_id = $3';
      params.push(productId);
    }

    const result = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    res.json({
      success: true,
      data: result.rows,
      message: 'Stock movements retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting stock movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock movements',
      details: error.message
    });
  }
});

// Get stock intake history
router.get('/intake-history/:productId?', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    let whereClause = '';
    const params = [parseInt(limit), parseInt(offset)];
    
    if (productId) {
      whereClause = 'WHERE si.product_id = $3';
      params.push(productId);
    }

    const result = await pool.query(`
      SELECT 
        si.*,
        p.name as product_name
      FROM stock_intake si
      JOIN products p ON si.product_id = p.id
      ${whereClause}
      ORDER BY si.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    res.json({
      success: true,
      data: result.rows,
      message: 'Stock intake history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting stock intake history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock intake history',
      details: error.message
    });
  }
});

// Check stock availability for order
router.post('/check-availability', async (req, res) => {
  try {
    const { items } = req.body; // Array of {product_id, quantity}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const availability = [];
    let allAvailable = true;

    for (const item of items) {
      const result = await pool.query(`
        SELECT 
          p.id, p.name, si.current_stock
        FROM products p
        LEFT JOIN stock_inventory si ON p.id = si.product_id
        WHERE p.id = $1
      `, [item.product_id]);

      if (result.rows.length === 0) {
        availability.push({
          product_id: item.product_id,
          available: false,
          reason: 'Product not found'
        });
        allAvailable = false;
        continue;
      }

      const product = result.rows[0];
      const currentStock = product.current_stock || 0;
      const requestedQuantity = parseInt(item.quantity);

      availability.push({
        product_id: item.product_id,
        product_name: product.name,
        requested_quantity: requestedQuantity,
        current_stock: currentStock,
        available: currentStock >= requestedQuantity,
        shortage: Math.max(0, requestedQuantity - currentStock)
      });

      if (currentStock < requestedQuantity) {
        allAvailable = false;
      }
    }

    res.json({
      success: true,
      data: {
        all_available: allAvailable,
        items: availability
      },
      message: 'Stock availability checked successfully'
    });
  } catch (error) {
    console.error('Error checking stock availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check stock availability',
      details: error.message
    });
  }
});

module.exports = router;