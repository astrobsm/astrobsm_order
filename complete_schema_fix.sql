-- 🔧 PRODUCTION DATABASE SCHEMA PATCHES
-- Run these queries to ensure compatibility with the application

-- Ensure order_items table has all required columns
DO $$ 
BEGIN 
  -- Add product_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='product_name') THEN
    ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255);
  END IF;
  
  -- Add price column if it doesn't exist (some schemas use this instead of unit_price)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='price') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_price') THEN
      -- Rename unit_price to price for consistency
      ALTER TABLE order_items RENAME COLUMN unit_price TO price;
    ELSE
      -- Add price column
      ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2);
    END IF;
  END IF;
  
  -- Remove NOT NULL constraint on price if it exists (will be set dynamically)
  ALTER TABLE order_items ALTER COLUMN price DROP NOT NULL;
  
  -- Add subtotal column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='subtotal') THEN
    ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10,2);
  END IF;
END $$;

-- Ensure stock_movements table has all required columns or make them optional
DO $$ 
BEGIN 
  -- Add reason column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='reason') THEN
    ALTER TABLE stock_movements ADD COLUMN reason TEXT;
  END IF;
  
  -- Add previous_stock column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='previous_stock') THEN
    ALTER TABLE stock_movements ADD COLUMN previous_stock INTEGER;
  END IF;
  
  -- Add new_stock column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='new_stock') THEN
    ALTER TABLE stock_movements ADD COLUMN new_stock INTEGER;
  END IF;
  
  -- Add reference_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='reference_type') THEN
    ALTER TABLE stock_movements ADD COLUMN reference_type VARCHAR(50);
  END IF;
  
  -- Add reference_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='reference_id') THEN
    ALTER TABLE stock_movements ADD COLUMN reference_id INTEGER;
  END IF;
END $$;

-- Update any existing order_items without product_name
UPDATE order_items 
SET product_name = p.name 
FROM products p 
WHERE order_items.product_id = p.id 
  AND (order_items.product_name IS NULL OR order_items.product_name = '');

-- Update any existing order_items without price
UPDATE order_items 
SET price = p.price 
FROM products p 
WHERE order_items.product_id = p.id 
  AND order_items.price IS NULL;

SELECT 'Schema patches completed successfully' as status;