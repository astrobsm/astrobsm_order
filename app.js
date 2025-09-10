// ASTRO-BSM Order Management System - Clean Version
// Global variables
const API_BASE_URL = '/api'; // Use relative URL to avoid CSP issues
let productList = [];
let itemCount = 0;
let orderTotal = { subtotal: 0, vat: 0, total: 0, items: [] };

// DOM Elements
const orderForm = document.getElementById('orderForm');
const itemsContainer = document.getElementById('itemsContainer'); // Fixed: correct element ID
const addItemBtn = document.getElementById('addItemBtn');
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Initializing ASTRO-BSM Order System...');
  
  // Register service worker for PWA functionality
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully:', registration.scope);
    } catch (error) {
      console.warn('⚠️ Service Worker registration failed:', error);
    }
  }
  
  try {
    // Check if required DOM elements exist
    if (!itemsContainer) {
      throw new Error('Items container element not found');
    }
    
    await loadProducts();
    setupEventListeners();
    createItemRow(); // Create first item row
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    showNotification('Failed to initialize application. Please refresh the page.', 'error');
  }
});

// Load products from API
async function loadProducts() {
  try {
    console.log('📦 Loading products from API...');
    const response = await fetch(`${API_BASE_URL}/admin/products`); // Correct endpoint
    
    if (response.ok) {
      productList = await response.json();
      console.log(`✅ Loaded ${productList.length} products from API`);
      console.log('🔍 First 3 products:', productList.slice(0, 3).map(p => `"${p.name}" - ₦${p.price}`));
      
      // Look for Opsite and GAUZE products specifically
      const opsiteProducts = productList.filter(p => p.name.toLowerCase().includes('opsite'));
      const gauzeProducts = productList.filter(p => p.name.toLowerCase().includes('gauze'));
      console.log('🔍 Opsite products:', opsiteProducts.map(p => `"${p.name}"`));
      console.log('🔍 GAUZE products:', gauzeProducts.map(p => `"${p.name}"`));
    } else {
      console.warn('⚠️ Failed to load products from API, using fallback');
      loadFallbackProducts();
    }
  } catch (error) {
    console.warn('⚠️ Network error loading products, using fallback:', error);
    loadFallbackProducts();
  }
}

// Fallback products if API fails
function loadFallbackProducts() {
  productList = [
    { name: "Wound-Care Honey Gauze Big (Carton)", price: 65000 },
    { name: "Wound-Care Honey Gauze Big (Packet)", price: 6000 },
    { name: "Wound-Care Honey Gauze Small (Carton)", price: 61250 },
    { name: "Wound-Care Honey Gauze Small (Packet)", price: 3500 },
    { name: "Hera Wound-Gel 100g (Carton)", price: 65000 },
    { name: "Hera Wound-Gel 100g (Tube)", price: 3250 },
    { name: "Hera Wound-Gel 40g (Carton)", price: 48000 },
    { name: "Hera Wound-Gel 40g (Tube)", price: 2000 },
    { name: "Coban Bandage 6 inch (Piece)", price: 4500 },
    { name: "Coban Bandage 6 inch (Carton)", price: 48500 },
    { name: "Coban Bandage 4 inch (Piece)", price: 3500 },
    { name: "Coban Bandage 4 inch (Carton)", price: 37500 },
    { name: "Silicone Scar Sheet (Packet)", price: 10000 },
    { name: "Silicone Scar Sheet (Block)", price: 90000 },
    { name: "Silicone Foot Pad (Pair)", price: 2000 },
    { name: "Sterile Dressing Pack (Bag)", price: 10000 },
    { name: "Sterile Dressing Pack (Piece)", price: 600 },
    { name: "Sterile Gauze-Only Pack (Bag)", price: 10000 },
    { name: "Sterile Gauze-Only Pack (Piece)", price: 600 },
    { name: "Skin Staples (Piece)", price: 4000 },
    { name: "NPWT (VAC) Foam (Piece)", price: 2000 },
    { name: "Opsite (Piece)", price: 6000 },
    { name: "Wound-Clex Solution 500ml (Carton)", price: 12500 },
    { name: "Wound-Clex Solution 500ml (Bottle)", price: 2300 }
  ];
  console.log('✅ Loaded fallback products');
}

// Create item row
function createItemRow() {
  itemCount++;
  const div = document.createElement('div');
  div.className = 'item-row fade-in';
  div.id = `item-row-${itemCount}`;
  
  const productOptions = Array.isArray(productList) && productList.length > 0 
    ? productList.map(item => {
        const formattedPrice = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(item.price);
        
        return `<option value="${item.name}">${item.name} - ${formattedPrice}</option>`;
      }).join('')
    : '<option value="">No products available</option>';

  div.innerHTML = `
    <div>
      <label for="item${itemCount}">Product</label>
      <select id="item${itemCount}" name="item${itemCount}" required>
        <option value="">Select product</option>
        ${productOptions}
      </select>
    </div>
    <div>
      <label for="quantity${itemCount}">Quantity</label>
      <input type="number" id="quantity${itemCount}" name="quantity${itemCount}" 
             min="1" placeholder="Qty" required>
    </div>
    <div>
      <button type="button" class="btn-danger" onclick="removeItem(${itemCount})">Remove</button>
    </div>
  `;
  
  itemsContainer.appendChild(div);
  
  // Add event listeners for real-time calculation
  const selectElement = div.querySelector(`select[name="item${itemCount}"]`);
  const quantityElement = div.querySelector(`input[name="quantity${itemCount}"]`);
  
  if (selectElement) {
    selectElement.addEventListener('change', calculateOrderTotal);
  }
  
  if (quantityElement) {
    quantityElement.addEventListener('input', calculateOrderTotal);
    quantityElement.addEventListener('change', calculateOrderTotal);
  }
}

// Remove item row
function removeItem(itemId) {
  const itemRow = document.getElementById(`item-row-${itemId}`);
  if (itemRow) {
    itemRow.remove();
    calculateOrderTotal();
  }
}

// ============================
// Calculate numeric order total
// ============================
function calculateOrderTotal() {
  console.log('🧮 Calculating order total...');
  let subtotal = 0;
  const items = [];
  
  // Process all item rows
  for (let i = 1; i <= itemCount; i++) {
    const productSelect = document.querySelector(`select[name="item${i}"]`);
    const quantityInput = document.querySelector(`input[name="quantity${i}"]`);
    
    if (productSelect && quantityInput && productSelect.value && quantityInput.value) {
      const selectedProductName = productSelect.value.trim();
      const product = productList.find(p => p.name === selectedProductName);
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
        
        console.log(`✅ Item ${i}: ${product.name} × ${quantity} = ₦${itemTotal.toFixed(2)}`);
      }
    }
  }
  
  // Calculate VAT and total
  const vat = subtotal * 0.025;
  const total = subtotal + vat;
  
  // Update global order total object for display
  orderTotal = { subtotal, vat, total, items };
  
  console.log('💰 Calculated Total (number):', total);
  
  // Update display
  updateOrderTotalDisplay();
  
  return total; // ✅ Return pure number, not object
}

// =====================================
// Update order total display on frontend
// =====================================
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
  
  console.log('📊 Updated order total display:', orderTotal.total);
  
  if (orderTotal.items && orderTotal.items.length > 0) {
    totalDisplay.style.display = 'block';
    subtotalElement.textContent = `₦${orderTotal.subtotal.toFixed(2)}`;
    vatElement.textContent = `₦${orderTotal.vat.toFixed(2)}`;
    totalElement.textContent = `₦${orderTotal.total.toFixed(2)}`;
    
    if (totalWordsElement) {
      const totalWords = orderTotal.total > 0 ? numberToWords(orderTotal.total) : 'Zero Naira Only';
      totalWordsElement.textContent = `Amount in Words: ${totalWords}`;
    }
  } else {
    totalDisplay.style.display = 'none';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Add item button
  if (addItemBtn) {
    addItemBtn.addEventListener('click', createItemRow);
  }
  
  // Form submission
  if (orderForm) {
    orderForm.addEventListener('submit', handleFormSubmission);
  }
  
  // Admin button
  if (adminBtn && adminModal) {
    adminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      adminModal.style.display = 'block';
      // Show password section first
      const passwordSection = document.getElementById('passwordSection');
      const ordersSection = document.getElementById('ordersSection');
      if (passwordSection) passwordSection.style.display = 'block';
      if (ordersSection) ordersSection.style.display = 'none';
    });
  }

  // Admin login functionality
  const loginBtn = document.getElementById('loginBtn');
  const adminPasswordInput = document.getElementById('adminPassword');
  
  console.log('🔍 Debug: loginBtn element:', loginBtn);
  console.log('🔍 Debug: adminPasswordInput element:', adminPasswordInput);
  
  if (loginBtn && adminPasswordInput) {
    console.log('✅ Admin login elements found, attaching event listeners...');
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🔐 Admin login button clicked');
      const password = adminPasswordInput.value;
      console.log('🔍 Password entered:', password ? 'Yes' : 'No');
      
      if (password === 'roseball') {
        console.log('✅ Password correct, granting access...');
        // Correct password - show admin interface
        const passwordSection = document.getElementById('passwordSection');
        const ordersSection = document.getElementById('ordersSection');
        if (passwordSection) {
          passwordSection.style.display = 'none';
          console.log('✅ Password section hidden');
        }
        if (ordersSection) {
          ordersSection.style.display = 'block';
          console.log('✅ Orders section shown');
        }
        loadAllOrders();
        showNotification('✅ Admin access granted', 'success');
      } else {
        console.log('❌ Password incorrect');
        // Wrong password
        adminPasswordInput.value = '';
        showNotification('❌ Invalid password', 'error');
      }
    });
    
    // Allow Enter key to submit password
    adminPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('⌨️ Enter key pressed, triggering login...');
        loginBtn.click();
      }
    });
  } else {
    console.log('❌ Admin login elements not found!');
    console.log('   loginBtn:', loginBtn);
    console.log('   adminPasswordInput:', adminPasswordInput);
  }
  
  // Close modal when clicking outside or close button
  window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.style.display = 'none';
      // Reset admin modal state
      const passwordSection = document.getElementById('passwordSection');
      const ordersSection = document.getElementById('ordersSection');
      const adminPasswordInput = document.getElementById('adminPassword');
      if (passwordSection) passwordSection.style.display = 'block';
      if (ordersSection) ordersSection.style.display = 'none';
      if (adminPasswordInput) adminPasswordInput.value = '';
    }
  });

  // Close button for admin modal
  const adminCloseBtn = adminModal?.querySelector('.close');
  if (adminCloseBtn) {
    adminCloseBtn.addEventListener('click', (e) => {
      adminModal.style.display = 'none';
      // Reset admin modal state
      const passwordSection = document.getElementById('passwordSection');
      const ordersSection = document.getElementById('ordersSection');
      const adminPasswordInput = document.getElementById('adminPassword');
      if (passwordSection) passwordSection.style.display = 'block';
      if (ordersSection) ordersSection.style.display = 'none';
      if (adminPasswordInput) adminPasswordInput.value = '';
    });
  }
}

// Handle form submission
async function handleFormSubmission(e) {
  e.preventDefault();
  console.log('📝 Handling form submission...');
  
  // Get submit button and store original text
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : 'Submit Order';
  
  try {
    // Show loading state
    if (submitBtn) {
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;
    }
    submitBtn.disabled = true;
    
    // Prepare form data
    const formData = new FormData(e.target);
    
    // Customer data
    const customerData = {
      name: formData.get('customerName'),
      email: formData.get('customerEmail'),
      phone: formData.get('customerPhone'),
      delivery_address: formData.get('deliveryAddress')
    };
    
    // Order data
    const orderData = {
      delivery_date: formData.get('deliveryDate'),
      delivery_route: formData.get('deliveryRoute'),
      preferred_delivery_method: formData.get('deliveryMethod'),
      request_status: formData.get('requestStatus')
    };
    
    // Items data
    const items = [];
    for (let i = 1; i <= itemCount; i++) {
      const productName = formData.get(`item${i}`);
      const quantity = parseInt(formData.get(`quantity${i}`));
      
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
    
    // Force calculation to ensure we have current totals
    const currentTotal = calculateOrderTotal(); // ✅ Now returns pure number
    
    // Prepare complete order payload
    const orderPayload = {
      customerData,
      orderData,
      items,
      total: currentTotal // ✅ Include numeric total
    };
    
    console.log('🚀 Submitting payload:', JSON.stringify(orderPayload, null, 2));
    
    // Submit order
    const result = await submitOrder(orderPayload);
    
    if (result.success) {
      // Show order summary (pass the orderTotal object for display)
      displayOrderSummary(customerData, orderData, items, orderTotal);
      
      // Reset form
      e.target.reset();
      itemsContainer.innerHTML = '';
      itemCount = 0;
      createItemRow();
      
      showNotification('✅ Order submitted successfully!', 'success');
    } else {
      throw new Error(result.error || 'Failed to submit order');
    }
    
  } catch (error) {
    console.error('❌ Form submission error:', error);
    showNotification(`❌ Error: ${error.message}`, 'error');
  } finally {
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
}

// Submit order to API
async function submitOrder(orderData) {
  console.log('📡 Submitting order to server...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
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
      return { success: false, error: `Server error: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

// Display order summary
function displayOrderSummary(customerData, orderData, items, totals) {
  console.log('📋 Displaying order summary...');
  
  // Use the passed totals or current orderTotal
  const finalTotals = totals || orderTotal;
  
  console.log('💰 Using totals:', finalTotals);
  
  // Create items table rows
  const itemsHTML = items.map(item => {
    const product = productList.find(p => p.name === item.product_name);
    const unitPrice = product ? parseFloat(product.price) : 0;
    const itemTotal = unitPrice * item.quantity;
    
    return `
      <tr>
        <td style="border: 1px solid #e5e7eb; padding: 10px;">${item.product_name}</td>
        <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">₦${unitPrice.toFixed(2)}</td>
        <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">₦${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  const deliveryMethodNames = {
    'pickup_enugu': 'Pickup from Enugu Office',
    'delivery_enugu': 'Home Delivery within Enugu',
    'transport_bus': 'Transport Bus (Interstate)',
    'courier_service': 'Courier Service',
    'airline_cargo': 'Airline Cargo'
  };
  
  const orderHTML = `
    <div style="max-width: 800px; margin: 20px auto; padding: 30px; font-family: Arial, sans-serif; background: white; border: 2px solid #1e3a8a; border-radius: 10px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
          <div style="font-size: 2.5em;">🏥</div>
          <div>
            <h1 style="color: #1e3a8a; margin: 0; font-size: 2em;">ASTRO-BSM</h1>
            <p style="margin: 0; color: #64748b; font-size: 1.1em;">Professional Medical Supplies</p>
          </div>
        </div>
        <h2 style="color: #1e3a8a; margin: 0;">Order Confirmation</h2>
      </div>

      <!-- Order Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px;">Order Details</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${customerData.name}</p>
          <p><strong>Phone:</strong> ${customerData.phone}</p>
          <p><strong>Urgency:</strong> ${orderData.request_status}</p>
        </div>
        <p><strong>Delivery Address:</strong><br>${customerData.delivery_address}</p>
        <p><strong>Preferred Delivery Date:</strong> ${new Date(orderData.delivery_date).toLocaleDateString()}</p>
        <p><strong>Delivery Method:</strong> ${deliveryMethodNames[orderData.preferred_delivery_method] || orderData.preferred_delivery_method}</p>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px;">Ordered Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #1e3a8a; color: white;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Product</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Quantity</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦${finalTotals.subtotal.toFixed(2)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">VAT (2.5%):</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦${finalTotals.vat.toFixed(2)}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">TOTAL AMOUNT:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold; font-size: 1.2em;">₦${finalTotals.total.toFixed(2)}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="4" style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-weight: bold; font-style: italic;">
                Amount in Words: ${numberToWords(finalTotals.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Instructions -->
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
        <p style="margin: 0; font-weight: bold;">Payment Instructions:</p>
        <p style="margin: 5px 0 10px 0;">Please make payment to any of the following accounts:</p>
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Account Details:</p>
          <p style="margin: 5px 0;"><strong>Account Name:</strong> BONNESANTE MEDICALS</p>
          <p style="margin: 5px 0;"><strong>Account 1:</strong> 8259518195 - MONIEPOINT MICROFINANCE BANK</p>
          <p style="margin: 5px 0;"><strong>Account 2:</strong> 1379643548 - ACCESS BANK</p>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 0.9em;">After payment: Send evidence to WhatsApp: +234 707 679 3866</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <p style="margin: 0; font-weight: bold; color: #1e40af;">📋 Order Confirmation Required:</p>
        <p style="margin: 5px 0; font-size: 0.9em;">Please review all order details above and confirm/acknowledge that your order was correctly captured before proceeding with payment.</p>
        <p style="margin: 15px 0 5px 0; font-weight: bold;">Thank you for choosing ASTRO-BSM Professional Medical Supplies</p>
        <p style="margin: 0; font-size: 0.9em; color: #64748b;">Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;
  
  // Create modal to display order summary
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10000;
    overflow-y: auto;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="position: relative;">
      <button onclick="this.parentElement.parentElement.remove()" 
              style="position: fixed; top: 30px; right: 30px; background: #dc2626; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; z-index: 10001;">
        ✕ Close
      </button>
      ${orderHTML}
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Load all orders for admin view
async function loadAllOrders() {
  try {
    console.log('📋 Loading orders for admin view...');
    console.log('🔗 API URL:', `${API_BASE_URL}/orders`);
    console.log('🌐 Full URL will be:', window.location.origin + `${API_BASE_URL}/orders`);
    
    const response = await fetch(`${API_BASE_URL}/orders`);
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    console.log('📡 Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const orders = await response.json();
      console.log(`✅ Loaded ${orders.length} orders`);
      console.log('📋 Raw orders data:', JSON.stringify(orders, null, 2));
      
      if (orders && Array.isArray(orders)) {
        displayOrdersList(orders);
      } else {
        console.error('❌ Orders response is not an array:', typeof orders, orders);
        showNotification('Invalid orders data format', 'error');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to load orders - Status:', response.status);
      console.error('❌ Error response:', errorText);
      showNotification(`Failed to load orders (${response.status})`, 'error');
    }
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    console.error('❌ Error stack:', error.stack);
    showNotification('Network error loading orders', 'error');
  }
}

// Display orders list in admin modal
function displayOrdersList(orders) {
  const ordersSection = document.getElementById('ordersSection');
  if (!ordersSection) {
    console.error('❌ Orders section element not found');
    console.error('Available elements:', document.querySelectorAll('[id*="order"]'));
    return;
  }
  
  console.log('📋 Displaying orders list, count:', orders.length);
  console.log('📋 Orders data type:', typeof orders, Array.isArray(orders));
  console.log('📋 First few orders:', orders.slice(0, 2));
  
  if (!orders || orders.length === 0) {
    const noOrdersHTML = `
      <h3>All Orders</h3>
      <div style="margin-bottom: 20px;">
        <button id="manageProductsBtn" class="btn-secondary">🛠️ Manage Products</button>
      </div>
      <div id="ordersList">
        <p style="text-align: center; padding: 20px; color: #666; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">
          📭 No orders found in the database.<br>
          <small>Orders will appear here once customers submit their orders.</small>
        </p>
      </div>
    `;
    ordersSection.innerHTML = noOrdersHTML;
    console.log('📋 Displayed "no orders" message');
    return;
  }
  
  const ordersHTML = orders.map(order => {
    console.log('📄 Processing order:', order.id, order);
    return `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; background: #f9f9f9;">
        <h4 style="margin: 0 0 10px 0; color: #1e3a8a;">Order #${order.id} - ${order.customer_name || order.name || 'Unknown Customer'}</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Phone:</strong> ${order.phone || 'Not provided'}</p>
          <p><strong>Email:</strong> ${order.email || 'Not provided'}</p>
          <p><strong>Status:</strong> ${order.request_status || 'Not specified'}</p>
        </div>
        <p><strong>Delivery Method:</strong> ${order.preferred_delivery_method || 'Not specified'}</p>
        <p><strong>Delivery Date:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not specified'}</p>
        <p><strong>Address:</strong> ${order.delivery_address || order.address || 'Not provided'}</p>
        ${order.delivery_route ? `<p><strong>Route:</strong> ${order.delivery_route}</p>` : ''}
      </div>
    `;
  }).join('');
  
  ordersSection.innerHTML = `
    <h3>All Orders</h3>
    <div style="margin-bottom: 20px;">
      <button id="manageProductsBtn" class="btn-secondary">🛠️ Manage Products</button>
    </div>
    <div id="ordersList">
      ${ordersHTML}
    </div>
  `;
}

// Number to words conversion
function numberToWords(number) {
  if (number === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];
  
  function convertThousands(num) {
    let result = '';
    
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    
    if (hundred > 0) {
      result += ones[hundred] + ' Hundred ';
    }
    
    if (remainder >= 20) {
      result += tens[Math.floor(remainder / 10)] + ' ';
      if (remainder % 10 > 0) {
        result += ones[remainder % 10] + ' ';
      }
    } else if (remainder >= 10) {
      result += teens[remainder - 10] + ' ';
    } else if (remainder > 0) {
      result += ones[remainder] + ' ';
    }
    
    return result.trim();
  }
  
  let integerPart = Math.floor(number);
  let result = '';
  let thousandIndex = 0;
  
  while (integerPart > 0) {
    const chunk = integerPart % 1000;
    if (chunk > 0) {
      const chunkWords = convertThousands(chunk);
      result = chunkWords + (thousands[thousandIndex] ? ' ' + thousands[thousandIndex] : '') + (result ? ' ' + result : '');
    }
    integerPart = Math.floor(integerPart / 1000);
    thousandIndex++;
  }
  
  return result.trim() + ' Naira Only';
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 400px;
    word-wrap: break-word;
  `;
  
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#10b981';
      break;
    case 'error':
      notification.style.backgroundColor = '#ef4444';
      break;
    case 'warning':
      notification.style.backgroundColor = '#f59e0b';
      break;
    default:
      notification.style.backgroundColor = '#3b82f6';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

console.log('✅ ASTRO-BSM Order System loaded successfully');

// Global functions for admin access (fallback)
window.handleAdminLogin = function() {
  console.log('🔐 handleAdminLogin called directly');
  const adminPasswordInput = document.getElementById('adminPassword');
  if (!adminPasswordInput) {
    console.log('❌ Password input not found');
    return;
  }
  
  const password = adminPasswordInput.value;
  console.log('🔍 Password entered:', password ? 'Yes' : 'No');
  
  if (password === 'roseball') {
    console.log('✅ Password correct, granting access...');
    const passwordSection = document.getElementById('passwordSection');
    const ordersSection = document.getElementById('ordersSection');
    
    if (passwordSection) {
      passwordSection.style.display = 'none';
      console.log('✅ Password section hidden');
    }
    if (ordersSection) {
      ordersSection.style.display = 'block';
      console.log('✅ Orders section shown');
    }
    
    loadAllOrders();
    showNotification('✅ Admin access granted', 'success');
  } else {
    console.log('❌ Password incorrect');
    adminPasswordInput.value = '';
    showNotification('❌ Invalid password', 'error');
  }
};

window.testAdminAccess = function() {
  console.log('🧪 Test button clicked');
  const passwordInput = document.getElementById('adminPassword');
  if (passwordInput) {
    passwordInput.value = 'roseball';
    console.log('✅ Password automatically filled');
    handleAdminLogin();
  } else {
    console.log('❌ Password input not found');
  }
};
