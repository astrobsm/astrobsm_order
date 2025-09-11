# CORRECTED FIX: Order Model Database Field Mismatch

## ISSUE IDENTIFIED
The debug script revealed that products in the database actually use `price` field, not `unit_price`.

**Current Database Structure:**
```json
{
  "id": 12,
  "name": "Coban Bandage 4 inch (Carton)",
  "price": "37500.00",
  "description": "Medical supply: Coban Bandage 4 inch (Carton)",
  ...
}
```

## INCORRECT FIX APPLIED
I previously changed the Order model from `product.price` to `product.unit_price`, but this was wrong!

## CORRECT FIX NEEDED
The Order model should use `product.price` (which matches the database).

### GitHub Fix Instructions:

1. Go to: https://github.com/astrobsm/astrobsm_order
2. Navigate to: `server/models/Order.js`
3. Find line around 30 that currently says:
   ```javascript
   const unitPrice = parseFloat(product.unit_price) || 0;
   ```
4. Change it BACK to:
   ```javascript
   const unitPrice = parseFloat(product.price) || 0;
   ```

## Why This Fixes It:
- Database products have `price` field
- Order model needs to access `product.price`
- This will make `parseFloat(product.price)` work correctly
- Orders will submit successfully

## Commit Message:
`CORRECT FIX: Order model should use product.price not product.unit_price`
