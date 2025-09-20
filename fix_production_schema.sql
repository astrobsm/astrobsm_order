-- Production Database Schema Fix for order_items table
-- Run this SQL in production to fix the null constraint issue

-- First, check current order_items table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If product_name column doesn't exist, add it
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

-- Make product_name nullable temporarily to fix existing data
ALTER TABLE order_items 
ALTER COLUMN product_name DROP NOT NULL;

-- Update any existing records that might have NULL product_name
UPDATE order_items 
SET product_name = p.name 
FROM products p 
WHERE order_items.product_id = p.id 
AND order_items.product_name IS NULL;

-- Now make it NOT NULL again (optional, based on business requirements)
-- ALTER TABLE order_items ALTER COLUMN product_name SET NOT NULL;