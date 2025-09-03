// Simple calculation test
console.log('🧪 Testing calculation logic...');

// Test data
const testItems = [
  { product_name: 'Silicone foot pad (pair)', quantity: 2 }
];

const testProductList = [
  { name: 'Silicone foot pad (pair)', price: 2000 }
];

// Simulate the calculation
let calculatedSubtotal = 0;
const itemsWithTotals = testItems.map(item => {
  console.log(`Processing item: ${item.product_name}, quantity: ${item.quantity}`);
  
  const product = testProductList.find(p => p.name === item.product_name);
  console.log('Found product:', product);
  
  const unitPrice = product ? parseFloat(product.price) || 0 : 0;
  const itemTotal = unitPrice * item.quantity;
  calculatedSubtotal += itemTotal;
  
  console.log(`Item calculation: ${unitPrice} × ${item.quantity} = ${itemTotal}`);
  
  return {
    ...item,
    unitPrice,
    itemTotal
  };
});

const calculatedVat = calculatedSubtotal * 0.025;
const calculatedTotal = calculatedSubtotal + calculatedVat;

console.log('💰 Test Results:');
console.log('Items:', itemsWithTotals);
console.log('Subtotal:', calculatedSubtotal);
console.log('VAT:', calculatedVat);
console.log('Total:', calculatedTotal);

console.log('✅ Test completed');
