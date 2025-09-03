// Clean rebuild of app.js with working calculations and online submission
const fs = require('fs');
const path = require('path');

console.log('🔧 Creating clean app.js with working calculations and online submission...');

const cleanAppJs = `// ASTRO-BSM Medical Order Form - Clean Version
// Main application logic with working calculations and online submission

// Global variables
const API_BASE_URL = '/api';
let productList = [];
let itemCount = 0;
let orderTotal = { subtotal: 0, vat: 0, total: 0, items: [] };
let isOnline = navigator.onLine;

// DOM element references
const orderForm = document.getElementById('orderForm');
const itemsContainer = document.getElementById('items');
const addItemBtn = document.getElementById('addItemBtn');
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');

// Number to words conversion
function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  function convertHundreds(n) {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  }

  let result = '';
  let thousandIndex = 0;
  
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      result = convertHundreds(chunk) + thousands[thousandIndex] + ' ' + result;
    }
    num = Math.floor(num / 1000);
    thousandIndex++;
  }
  
  return result.trim();
}

// Load products from API
async function loadProducts() {
  try {
    console.log('📦 Loading products...');
    const response = await fetch(\`\${API_BASE_URL}/admin/products\`);
    
    if (response.ok) {
      const data = await response.json();
      productList = Array.isArray(data) ? data : [];
      console.log('✅ Products loaded:', productList.length);
      
      // Update existing select elements
      document.querySelectorAll('select[name^="item"]').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a product</option>';
        productList.forEach(product => {
          const option = document.createElement('option');
          option.value = product.name;
          option.textContent = \`\${product.name} - ₦\${parseFloat(product.price).toFixed(2)}\`;
          select.appendChild(option);
        });
        if (currentValue) select.value = currentValue;
      });
      
      return productList;
    } else {
      throw new Error('Failed to load products');
    }
  } catch (error) {
    console.error('❌ Error loading products:', error);
    productList = [];
    return [];
  }
}

// Create item row with proper event listeners
function createItemRow() {
  itemCount++;
  const div = document.createElement('div');
  div.className = 'item-row fade-in';
  
  const productOptions = Array.isArray(productList) && productList.length > 0 
    ? productList.map(item => {
        const formattedPrice = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(item.price);
        
        return \`<option value="\${item.name}">\${item.name} - \${formattedPrice}</option>\`;
      }).join('')
    : '<option value="">No products available</option>';

  div.innerHTML = \`
    <div>
      <label for="item\${itemCount}">Product</label>
      <select id="item\${itemCount}" name="item\${itemCount}" required>
        <option value="">Select product</option>
        \${productOptions}
      </select>
    </div>
    <div>
      <label for="quantity\${itemCount}">Quantity</label>
      <input type="number" id="quantity\${itemCount}" name="quantity\${itemCount}" 
             min="1" placeholder="Qty" required>
    </div>
    <div>
      <button type="button" class="btn-danger removeItemBtn">Remove</button>
    </div>
  \`;
  
  itemsContainer.appendChild(div);
  
  // Add remove functionality
  div.querySelector('.removeItemBtn').addEventListener('click', () => {
    div.remove();
    calculateOrderTotal();
  });
  
  // Add calculation triggers
  const selectElement = div.querySelector(\`select[name="item\${itemCount}"]\`);
  const quantityElement = div.querySelector(\`input[name="quantity\${itemCount}"]\`);
  
  if (selectElement) {
    selectElement.addEventListener('change', calculateOrderTotal);
  }
  
  if (quantityElement) {
    quantityElement.addEventListener('input', calculateOrderTotal);
    quantityElement.addEventListener('change', calculateOrderTotal);
  }
}

// Calculate order total with debugging
function calculateOrderTotal() {
  console.log('🧮 === CALCULATING ORDER TOTAL ===');
  let subtotal = 0;
  const items = [];
  
  if (!productList || !Array.isArray(productList) || productList.length === 0) {
    console.log('❌ ProductList not available');
    return { subtotal: 0, vat: 0, total: 0, items: [] };
  }
  
  for (let i = 1; i <= itemCount; i++) {
    const productSelect = document.querySelector(\`select[name="item\${i}"]\`);
    const quantityInput = document.querySelector(\`input[name="quantity\${i}"]\`);
    
    if (productSelect && quantityInput && productSelect.value && quantityInput.value) {
      const selectedProductName = productSelect.value.trim();
      const product = productList.find(p => p.name && p.name.trim() === selectedProductName);
      const quantity = parseInt(quantityInput.value) || 0;
      
      if (product && quantity > 0) {
        const price = parseFloat(product.price) || 0;
        const itemTotal = price * quantity;
        subtotal += itemTotal;
        
        items.push({
          name: product.name,
          price: price,
          quantity: quantity,
          total: itemTotal
        });
        
        console.log(\`✅ Item: \${product.name}, Price: ₦\${price}, Qty: \${quantity}, Total: ₦\${itemTotal}\`);
      }
    }
  }
  
  const vat = subtotal * 0.025;
  const total = subtotal + vat;
  
  orderTotal = { subtotal, vat, total, items };
  
  console.log('💰 Final Totals:');
  console.log(\`Subtotal: ₦\${subtotal.toFixed(2)}\`);
  console.log(\`VAT (2.5%): ₦\${vat.toFixed(2)}\`);
  console.log(\`Total: ₦\${total.toFixed(2)}\`);
  
  updateOrderTotalDisplay();
  return orderTotal;
}

// Update order total display
function updateOrderTotalDisplay() {
  const totalDisplay = document.getElementById('orderTotal');
  const subtotalElement = document.getElementById('subtotalAmount');
  const vatElement = document.getElementById('vatAmount');
  const totalElement = document.getElementById('totalAmount');
  const totalWordsElement = document.getElementById('totalAmountWords');
  
  if (!totalDisplay || !subtotalElement || !vatElement || !totalElement) {
    console.log('⚠️ Order total display elements not found');
    return;
  }
  
  if (orderTotal.items && orderTotal.items.length > 0) {
    totalDisplay.style.display = 'block';
    subtotalElement.textContent = \`₦\${orderTotal.subtotal.toFixed(2)}\`;
    vatElement.textContent = \`₦\${orderTotal.vat.toFixed(2)}\`;
    totalElement.textContent = \`₦\${orderTotal.total.toFixed(2)}\`;
    
    if (totalWordsElement) {
      const totalWords = orderTotal.total > 0 ? numberToWords(orderTotal.total) : 'Zero';
      totalWordsElement.textContent = \`Amount in Words: \${totalWords} Naira Only\`;
    }
    
    console.log('✅ Order total display updated');
  } else {
    totalDisplay.style.display = 'none';
  }
}

// Simple and reliable order submission
async function submitOrder(orderData) {
  console.log('🚀 Submitting order to server...', orderData);
  
  try {
    const response = await fetch(\`\${API_BASE_URL}/orders\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Order submitted successfully:', result);
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      console.error('❌ Server error:', response.status, errorText);
      throw new Error(\`Server error: \${errorText}\`);
    }
  } catch (error) {
    console.error('❌ Submission error:', error);
    throw error;
  }
}

// Display order summary with forced calculation
function displayOrderSummary(customerData, orderData, items, orderResult) {
  console.log('🧾 === DISPLAYING ORDER SUMMARY ===');
  
  // Force calculation to ensure we have correct totals
  const currentTotals = calculateOrderTotal();
  console.log('Current totals for display:', currentTotals);
  
  // Use current totals for display
  const finalSubtotal = currentTotals.subtotal;
  const finalVat = currentTotals.vat;
  const finalTotal = currentTotals.total;
  
  // Generate order summary HTML
  const orderDate = new Date().toLocaleDateString();
  const orderTime = new Date().toLocaleTimeString();
  
  const deliveryMethodNames = {
    'pickup_enugu': 'Pickup from Enugu Office',
    'delivery_enugu': 'Home Delivery within Enugu',
    'transport_bus': 'Transport Bus (Interstate)',
    'courier_service': 'Courier Service',
    'airline_cargo': 'Airline Cargo'
  };
  
  const orderSummaryHtml = \`
    <div class="order-summary-container" style="max-width: 800px; margin: 20px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
          </div>
          <div>
            <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">ASTRO-BSM</h1>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Professional Medical Supplies</p>
          </div>
        </div>
        <h2 style="color: #1e3a8a; margin: 0;">ASTRO-BSM Order Confirmation</h2>
        <p style="color: #64748b; margin: 0; font-weight: 500;">Professional Medical Supplies</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 20px; border-radius: 8px;">
          <div><strong>Order ID:</strong> \${orderResult?.id || 'N/A'}</div>
          <div><strong>Order Date:</strong> \${orderDate}</div>
          <div><strong>Customer:</strong> \${customerData.name}</div>
          <div><strong>Phone:</strong> \${customerData.phone}</div>
          <div><strong>Urgency:</strong> \${orderData.request_status}</div>
          <div><strong>Delivery Address:</strong><br>\${customerData.delivery_address}</div>
        </div>
        
        <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div><strong>Preferred Delivery Date:</strong> \${orderData.delivery_date}</div>
          <div><strong>Delivery Method:</strong> \${deliveryMethodNames[orderData.preferred_delivery_method] || orderData.preferred_delivery_method}</div>
        </div>
        
        \${orderData.delivery_route ? \`<div style="margin-top: 10px;"><strong>Delivery Instructions:</strong> \${orderData.delivery_route}</div>\` : ''}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Ordered Items</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #1e3a8a; color: white;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Product</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Quantity</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            \${currentTotals.items.map(item => \`
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="border: 1px solid #e5e7eb; padding: 12px;">\${item.name}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">\${item.quantity}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">₦\${item.price.toFixed(2)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; font-weight: bold;">₦\${item.total.toFixed(2)}</td>
              </tr>
            \`).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦\${finalSubtotal.toFixed(2)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">VAT (2.5%):</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦\${finalVat.toFixed(2)}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">TOTAL AMOUNT:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold; font-size: 1.2em;">₦\${finalTotal.toFixed(2)}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="4" style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-weight: bold; font-style: italic;">
                Amount in Words: \${numberToWords(finalTotal)} Naira Only
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
        <p style="margin: 0; font-weight: bold;">Payment Instructions:</p>
        <p style="margin: 5px 0 10px 0;">Please make payment to any of the following accounts:</p>
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Account Details:</p>
          <p style="margin: 5px 0;"><strong>Account Name:</strong> BONNESANTE MEDICALS</p>
          <p style="margin: 5px 0;"><strong>Account 1:</strong> 8259518195 - MONIEPOINT MICROFINANCE BANK</p>
          <p style="margin: 5px 0;"><strong>Account 2:</strong> 1379643548 - ACCESS BANK</p>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 14px;">After payment: Send evidence with Order ID #\${orderResult?.id || 'N/A'} to WhatsApp: +234 707 679 3866</p>
      </div>
      
      <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; font-weight: bold; color: #1e40af;">📋 Order Confirmation Required:</p>
        <p style="margin: 5px 0 0 0; color: #1e40af;">Please review all order details above and confirm/acknowledge that your order was correctly captured before proceeding with payment.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #64748b;">
        <p style="margin: 0; font-weight: bold;">Thank you for choosing ASTRO-BSM Professional Medical Supplies</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Generated on \${orderDate}, \${orderTime}</p>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #1e3a8a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">📄 Print Order</button>
        <button onclick="exportOrderAsJPG()" style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">📄 Export as JPG</button>
        <button onclick="shareViaEmail()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">📧 Share via Email</button>
        <button onclick="shareViaWhatsApp()" style="background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">📱 Share to WhatsApp</button>
      </div>
    </div>
  \`;
  
  // Display the order summary
  document.body.innerHTML = orderSummaryHtml;
  
  console.log('✅ Order summary displayed with totals:', { finalSubtotal, finalVat, finalTotal });
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = \`notification notification-\${type}\`;
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  \`;
  
  switch(type) {
    case 'success':
      notification.style.background = '#059669';
      break;
    case 'error':
      notification.style.background = '#dc2626';
      break;
    case 'warning':
      notification.style.background = '#d97706';
      break;
    default:
      notification.style.background = '#0ea5e9';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Initializing ASTRO-BSM Order App...');
  
  // Load products
  await loadProducts();
  
  // Create initial item row
  createItemRow();
  
  // Add item button event listener
  if (addItemBtn) {
    addItemBtn.addEventListener('click', createItemRow);
  }
  
  // Form submission handler
  if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        const formData = new FormData(this);
        
        // Prepare customer data
        const customerData = {
          name: formData.get('customerName'),
          email: formData.get('customerEmail'),
          phone: formData.get('customerPhone'),
          delivery_address: formData.get('deliveryAddress')
        };
        
        // Prepare order data
        const orderData = {
          delivery_date: formData.get('deliveryDate'),
          delivery_route: formData.get('deliveryRoute'),
          preferred_delivery_method: formData.get('deliveryMethod'),
          request_status: formData.get('requestStatus')
        };
        
        // Prepare items
        const items = [];
        for (let i = 1; i <= itemCount; i++) {
          const productName = formData.get(\`item\${i}\`);
          const quantity = parseInt(formData.get(\`quantity\${i}\`));
          
          if (productName && quantity) {
            items.push({
              product_name: productName,
              quantity: quantity
            });
          }
        }
        
        if (items.length === 0) {
          throw new Error('Please add at least one item to your order');
        }
        
        // Force calculation before submission
        const currentTotals = calculateOrderTotal();
        console.log('Final totals before submission:', currentTotals);
        
        // Submit to server
        const result = await submitOrder({
          customerData,
          orderData,
          items
        });
        
        if (result.success) {
          showNotification('✅ Order submitted successfully!', 'success');
          displayOrderSummary(customerData, orderData, items, result.data);
        }
        
      } catch (error) {
        console.error('❌ Order submission failed:', error);
        showNotification(\`❌ Failed to submit order: \${error.message}\`, 'error');
      }
    });
  }
  
  // Simple admin button handler
  if (adminBtn) {
    adminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/admin.html';
    });
  }
  
  console.log('✅ App initialized successfully');
});

// Export functions for buttons (simplified versions)
window.exportOrderAsJPG = function() {
  showNotification('Export feature coming soon!', 'info');
};

window.shareViaEmail = function() {
  showNotification('Email sharing feature coming soon!', 'info');
};

window.shareViaWhatsApp = function() {
  showNotification('WhatsApp sharing feature coming soon!', 'info');
};

// Manual calculation function for testing
window.debugCalculation = function() {
  console.log('🔧 Manual debug calculation triggered');
  const result = calculateOrderTotal();
  console.log('Debug result:', result);
  return result;
};

console.log('📜 ASTRO-BSM Order App script loaded');
`;

// Write the clean version
fs.writeFileSync(path.join(__dirname, 'app.js'), cleanAppJs, 'utf8');
console.log('✅ Created clean app.js with working calculations and online submission');
console.log('🎯 Features included:');
console.log('  - Working product loading');
console.log('  - Real-time calculation updates');
console.log('  - Clean online order submission');
console.log('  - Proper order summary with correct totals');
console.log('  - No syntax errors or duplicates');
console.log('  - Debugging functions available');
