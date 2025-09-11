CRITICAL ORDER SUBMISSION FIX FOR PRODUCTION

The 500 Internal Server Error when submitting orders is caused by a database schema mismatch.

FILE: server/models/Order.js
LINE: 30

CHANGE FROM:
        const unitPrice = parseFloat(product.price) || 0;

CHANGE TO:
        const unitPrice = parseFloat(product.unit_price) || 0;

EXPLANATION:
The production database uses 'unit_price' column name, but the code was trying to access 'price'.
This causes the order creation to fail with a 500 error.

ADDITIONAL IMPROVEMENT (Optional):
In server/routes/orders.js, around line 30-33, enhance error logging:

CHANGE FROM:
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }

CHANGE TO:
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }

This fix should resolve the 500 error immediately after deployment.
