// Quick fix to force correct calculations
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Add a manual calculation trigger at the start of displayOrderSummary
const fixCode = `
  // MANUAL FIX: Force recalculation before displaying
  const forceCalculation = calculateOrderTotal();
  console.log('🔧 FORCED CALCULATION:', forceCalculation);
  
  // Override with forced calculation
  if (forceCalculation && forceCalculation.subtotal > 0) {
    const finalSubtotal = forceCalculation.subtotal;
    const finalVat = forceCalculation.vat;
    const finalTotal = forceCalculation.total;
  } else {
`;

// Insert this right after the function declaration
const insertPoint = 'function displayOrderSummary(customerData, orderData, items, order) {';
const insertIndex = content.indexOf(insertPoint);

if (insertIndex !== -1) {
  const insertAfter = insertIndex + insertPoint.length;
  const newContent = content.substring(0, insertAfter) + fixCode + content.substring(insertAfter);
  
  fs.writeFileSync(appJsPath, newContent, 'utf8');
  console.log('✅ Applied manual calculation fix');
} else {
  console.log('❌ Could not find insertion point');
}
