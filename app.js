// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Product list - will be loaded from API
let productList = [];

// DOM Elements
const itemsContainer = document.getElementById('itemsContainer');
const addItemBtn = document.getElementById('addItemBtn');
const orderForm = document.getElementById('orderForm');
const orderSummary = document.getElementById('orderSummary');
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const productModal = document.getElementById('productModal');
const closeModal = document.querySelector('.close');
const loginBtn = document.getElementById('loginBtn');
const adminPassword = document.getElementById('adminPassword');
const passwordSection = document.getElementById('passwordSection');
const ordersSection = document.getElementById('ordersSection');
const ordersList = document.getElementById('ordersList');
let itemCount = 0;
let orderTotal = { subtotal: 0, vat: 0, total: 0 };

// Function to convert number to words (for Nigerian Naira)
function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  function convertHundreds(n) {
    let result = '';
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred';
      n %= 100;
      if (n > 0) result += ' ';
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) result += ' ' + ones[n];
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += ones[n];
    }
    
    return result;
  }

  function convertToWords(number) {
    if (number === 0) return '';
    
    let result = '';
    let thousandCounter = 0;
    
    while (number > 0) {
      let chunk = number % 1000;
      if (chunk !== 0) {
        let chunkWords = convertHundreds(chunk);
        if (thousands[thousandCounter]) {
          chunkWords += ' ' + thousands[thousandCounter];
        }
        result = chunkWords + (result ? ' ' + result : '');
      }
      number = Math.floor(number / 1000);
      thousandCounter++;
    }
    
    return result;
  }

  // Handle decimal places (kobo)
  const parts = num.toString().split('.');
  const nairaAmount = parseInt(parts[0]);
  const koboAmount = parts[1] ? parseInt(parts[1].padEnd(2, '0').substring(0, 2)) : 0;
  
  let result = '';
  
  if (nairaAmount > 0) {
    result += convertToWords(nairaAmount) + ' Naira';
  }
  
  if (koboAmount > 0) {
    if (result) result += ' and ';
    result += convertToWords(koboAmount) + ' Kobo';
  }
  
  if (!result) result = 'Zero Naira';
  
  return result + ' Only';
}

// Load products from API with comprehensive error handling
async function loadProducts() {
  try {
    console.log('🔍 Loading products from database...');
    
    const response = await fetch(`${API_BASE_URL}/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const products = await response.json();
    
    if (!Array.isArray(products)) {
      throw new Error('Invalid product data format received');
    }
    
    if (products.length === 0) {
      throw new Error('No products found in database');
    }
    
    // Validate product structure
    const validProducts = products.filter(product => {
      return product && 
             typeof product.name === 'string' && 
             product.name.trim() !== '' &&
             (product.price !== undefined || product.unit_price !== undefined) &&
             product.id !== undefined;
    });
    
    if (validProducts.length === 0) {
      throw new Error('No valid products found (missing required fields)');
    }
    
    // Normalize price field - use 'price' as the standard field
    productList = validProducts.map(product => ({
      ...product,
      price: product.price || product.unit_price,
      displayPrice: parseFloat(product.price || product.unit_price || 0).toFixed(2)
    }));
    
    console.log(`✅ Successfully loaded ${productList.length} products from database`);
    
    // Trigger UI update
    updateProductSelectors();
    
  } catch (error) {
    console.error('❌ Error loading products:', error.message);
    
    // Show user-friendly error message
    showProductLoadError(error.message);
    
    // Clear product list to prevent using outdated data
    productList = [];
    
    // Update UI to show error state
    updateProductSelectors();
  }
}

// Show error message to user when products fail to load
function showProductLoadError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    background-color: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    text-align: center;
  `;
  errorDiv.innerHTML = `
    <strong>⚠️ Unable to load products</strong><br>
    ${message}<br>
    <small>Please refresh the page or contact support if the problem persists.</small>
  `;
  
  // Insert error message at the top of the form
  const form = document.getElementById('orderForm');
  if (form) {
    form.insertBefore(errorDiv, form.firstChild);
  }
}

// Update all product selectors when product list changes
function updateProductSelectors() {
  const selectors = document.querySelectorAll('select[name^="item"]');
  selectors.forEach(selector => {
    updateProductSelector(selector);
  });
}

// Update a single product selector with current product list
function updateProductSelector(selector) {
  if (!selector) return;
  
  const currentValue = selector.value;
  
  // Clear existing options
  selector.innerHTML = '<option value="">Select product</option>';
  
  if (!Array.isArray(productList) || productList.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No products available - Please refresh page';
    option.disabled = true;
    selector.appendChild(option);
    return;
  }
  
  // Add products with price information
  productList.forEach(product => {
    const option = document.createElement('option');
    option.value = product.name;
    option.textContent = `${product.name} - ₦${product.displayPrice}`;
    option.dataset.price = product.price;
    option.dataset.productId = product.id;
    
    // Restore previous selection if it exists
    if (product.name === currentValue) {
      option.selected = true;
    }
    
    selector.appendChild(option);
  });
}

// Create item row with improved styling and dynamic products
function createItemRow() {
  itemCount++;
  const div = document.createElement('div');
  div.className = 'item-row fade-in';

  div.innerHTML = `
    <div>
      <label for="item${itemCount}">Product</label>
      <select id="item${itemCount}" name="item${itemCount}" required>
        <option value="">Select product</option>
      </select>
    </div>
    <div>
      <label for="quantity${itemCount}">Quantity</label>
      <input type="number" id="quantity${itemCount}" name="quantity${itemCount}" 
             min="1" placeholder="Qty" required>
    </div>
    <div class="price-display">
      <span class="item-price" id="price${itemCount}">₦0.00</span>
    </div>
    <div>
      <button type="button" class="btn-danger removeItemBtn">Remove</button>
    </div>
  `;
  
  itemsContainer.appendChild(div);
  
  // Populate the product selector
  const productSelect = div.querySelector(`select[name="item${itemCount}"]`);
  updateProductSelector(productSelect);
  
  // Add event listeners for dynamic price updates
  productSelect.addEventListener('change', function() {
    updateItemPrice(itemCount);
    calculateOrderTotal();
  });
  
  const quantityInput = div.querySelector(`input[name="quantity${itemCount}"]`);
  quantityInput.addEventListener('input', function() {
    updateItemPrice(itemCount);
    calculateOrderTotal();
  });
  
  // Add remove functionality
  div.querySelector('.removeItemBtn').addEventListener('click', () => {
    div.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      div.remove();
      calculateOrderTotal();
    }, 300);
  });
}

// Update item price display based on selected product and quantity
function updateItemPrice(itemNumber) {
  const productSelect = document.querySelector(`select[name="item${itemNumber}"]`);
  const quantityInput = document.querySelector(`input[name="quantity${itemNumber}"]`);
  const priceDisplay = document.getElementById(`price${itemNumber}`);
  
  if (!productSelect || !quantityInput || !priceDisplay) return;
  
  const selectedOption = productSelect.selectedOptions[0];
  const quantity = parseInt(quantityInput.value) || 0;
  
  if (!selectedOption || !selectedOption.dataset.price || quantity <= 0) {
    priceDisplay.textContent = '₦0.00';
    return;
  }
  
  const unitPrice = parseFloat(selectedOption.dataset.price) || 0;
  const totalPrice = unitPrice * quantity;
  
  priceDisplay.textContent = `₦${totalPrice.toFixed(2)}`;
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
  .price-display {
    text-align: center;
    font-weight: bold;
    color: #2c3e50;
  }
  .item-price {
    font-size: 1.1em;
    color: #27ae60;
  }
`;
document.head.appendChild(style);

// Cost calculation functions
function calculateOrderTotal() {
  let subtotal = 0;
  const items = [];
  
  // Calculate subtotal from all items
  for (let i = 1; i <= itemCount; i++) {
    const productSelect = document.querySelector(`select[name="item${i}"]`);
    const quantityInput = document.querySelector(`input[name="quantity${i}"]`);
    
    if (productSelect && quantityInput && productSelect.value && quantityInput.value) {
      const product = productList.find(p => p.name === productSelect.value);
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
      }
    }
  }
  
  // Calculate VAT (2.5%)
  const vat = subtotal * 0.025;
  const total = subtotal + vat;
  
  orderTotal = { subtotal, vat, total, items };
  updateOrderTotalDisplay();
  
  return orderTotal;
}

// Calculate total from order items array (for admin panel)
function calculateOrderTotalFromItems(items) {
  if (!items || items.length === 0) return '0.00';
  
  let subtotal = 0;
  items.forEach(item => {
    const price = parseFloat(item.price || item.unit_price || 0);
    const quantity = parseInt(item.quantity || 0);
    subtotal += price * quantity;
  });
  
  const vat = subtotal * 0.025;
  const total = subtotal + vat;
  
  return total.toFixed(2);
}

function updateOrderTotalDisplay() {
  const totalDisplay = document.getElementById('orderTotal');
  const subtotalElement = document.getElementById('subtotalAmount');
  const vatElement = document.getElementById('vatAmount');
  const totalElement = document.getElementById('totalAmount');
  const totalWordsElement = document.getElementById('totalAmountWords');
  
  // Check if all elements exist before proceeding
  if (!totalDisplay || !subtotalElement || !vatElement || !totalElement) {
    console.log('Order total display elements not found yet, skipping update');
    return;
  }
  
  if (orderTotal.total > 0) {
    totalDisplay.style.display = 'block';
    subtotalElement.textContent = `₦${orderTotal.subtotal.toFixed(2)}`;
    vatElement.textContent = `₦${orderTotal.vat.toFixed(2)}`;
    totalElement.textContent = `₦${orderTotal.total.toFixed(2)}`;
    
    // Update amount in words if element exists
    if (totalWordsElement) {
      totalWordsElement.textContent = `Amount in Words: ${numberToWords(orderTotal.total)}`;
    }
  } else {
    totalDisplay.style.display = 'none';
  }
}

// Add event listeners to update totals when items change
function addItemChangeListeners() {
  const itemsContainer = document.getElementById('itemsContainer');
  
  itemsContainer.addEventListener('change', (e) => {
    if (e.target.matches('select[name^="item"]') || e.target.matches('input[name^="quantity"]')) {
      calculateOrderTotal();
    }
  });
  
  itemsContainer.addEventListener('input', (e) => {
    if (e.target.matches('input[name^="quantity"]')) {
      calculateOrderTotal();
    }
  });
}

// Initialize item change listeners
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load products first
    await loadProducts();
    
    // Create initial item row
    createItemRow();
    
    // Add change listeners
    addItemChangeListeners();
    
    // Set up Add Item button
    if (addItemBtn) {
      addItemBtn.addEventListener('click', createItemRow);
    }
    
    // Set up admin functionality
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        adminModal.style.display = 'block';
      });
    }
    
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        adminModal.style.display = 'none';
        passwordSection.style.display = 'block';
        ordersSection.style.display = 'none';
        adminPassword.value = '';
      });
    }
    
    window.addEventListener('click', (event) => {
      if (event.target === adminModal) {
        adminModal.style.display = 'none';
        passwordSection.style.display = 'block';
        ordersSection.style.display = 'none';
        adminPassword.value = '';
      }
      if (productModal && event.target === productModal) {
        productModal.style.display = 'none';
      }
    });
    
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const password = adminPassword.value;
        if (password === 'bluevelvet') {
          passwordSection.style.display = 'none';
          ordersSection.style.display = 'block';
          await loadAllOrders();
        } else {
          alert('Incorrect password');
          adminPassword.value = '';
        }
      });
    }
    
    if (adminPassword) {
      adminPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          loginBtn.click();
        }
      });
    }

    // Set up Product Management button
    const manageProductsBtn = document.getElementById('manageProductsBtn');
    if (manageProductsBtn) {
      manageProductsBtn.addEventListener('click', () => {
        const password = prompt('Enter password for product management:');
        if (password === 'bluevelvet') {
          if (productModal) {
            productModal.style.display = 'block';
            loadProductManagement();
          }
        } else if (password !== null) {
          alert('Incorrect password');
        }
      });
    }

    // Set up Product Management form buttons
    const addProductBtn = document.getElementById('addProductBtn');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const addProductForm = document.getElementById('addProductForm');

    if (addProductBtn && addProductForm) {
      addProductBtn.addEventListener('click', () => {
        addProductForm.style.display = 'block';
        // Reset form
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductDescription').value = '';
        // Reset save button
        if (saveProductBtn) {
          saveProductBtn.onclick = () => saveProduct();
          saveProductBtn.textContent = 'Save Product';
        }
      });
    }

    if (cancelProductBtn && addProductForm) {
      cancelProductBtn.addEventListener('click', () => {
        addProductForm.style.display = 'none';
      });
    }

    if (saveProductBtn) {
      saveProductBtn.addEventListener('click', () => saveProduct());
    }

    console.log('Application initialized successfully');
    
    // Add event listeners for dynamically created buttons
    setupDynamicEventListeners();
    
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});

// Form submission handler
orderForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  // Show loading state
  submitBtn.textContent = 'Processing...';
  submitBtn.disabled = true;
  this.classList.add('loading');
  
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
    
    // Submit to API
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerData,
        orderData,
        items
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit order');
    }
    
    const result = await response.json();
    
    // Show success summary
    displayOrderSummary(customerData, orderData, items, result.order);
    
    // Reset form
    this.reset();
    itemsContainer.innerHTML = '';
    itemCount = 0;
    createItemRow();
    
  } catch (error) {
    console.error('Error submitting order:', error);
    alert('Error submitting order: ' + error.message);
  } finally {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    this.classList.remove('loading');
  }
});

// Display order summary
function displayOrderSummary(customerData, orderData, items, order) {
  const deliveryMethodNames = {
    'pickup_enugu': 'Pickup from Enugu Office',
    'delivery_enugu': 'Home Delivery within Enugu',
    'transport_bus': 'Transport Bus (Interstate)',
    'courier_service': 'Courier Service',
    'airline_cargo': 'Airline Cargo',
    'personal_arrangement': 'Personal Arrangement'
  };
  
  const urgencyNames = {
    'can_wait_24hrs': 'Can wait for 24 hours',
    'urgent': 'Urgent',
    'very_urgent': 'Very Urgent'
  };
  
  let summary = `
    <div id="exportableContent">
      <div style="text-align: center; margin-bottom: 20px; padding: 20px; background: white;">
        <img src="public/company_logo.PNG" alt="ASTRO-BSM Logo" style="height: 80px; margin-bottom: 10px;">
        <h2 style="color: #1e3a8a; margin: 0;">ASTRO-BSM Order Confirmation</h2>
        <p style="margin: 5px 0; color: #6b7280;">Professional Medical Supplies</p>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Order Details</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
          <p><strong>Order ID:</strong> ${order?.id || 'N/A'}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${customerData.name}</p>
          <p><strong>Phone:</strong> ${customerData.phone}</p>
          ${customerData.email ? `<p><strong>Email:</strong> ${customerData.email}</p>` : '<p></p>'}
          <p><strong>Urgency:</strong> <span style="color: ${orderData.request_status === 'very_urgent' ? '#991b1b' : orderData.request_status === 'urgent' ? '#9a3412' : '#065f46'}; font-weight: bold;">${urgencyNames[orderData.request_status] || orderData.request_status}</span></p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p><strong>Delivery Address:</strong><br>${customerData.delivery_address}</p>
          <p><strong>Preferred Delivery Date:</strong> ${new Date(orderData.delivery_date).toLocaleDateString()}</p>
          <p><strong>Delivery Method:</strong> ${deliveryMethodNames[orderData.preferred_delivery_method] || orderData.preferred_delivery_method}</p>
          ${orderData.delivery_route ? `<p><strong>Delivery Instructions:</strong> ${orderData.delivery_route}</p>` : ''}
        </div>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Ordered Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left;">Product</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: center;">Quantity</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const product = productList.find(p => p.name === item.product_name);
              const unitPrice = product ? parseFloat(product.price) || 0 : 0;
              const itemTotal = unitPrice * item.quantity;
              return `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 10px;">${item.product_name}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">₦${unitPrice.toFixed(2)}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">₦${itemTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦${parseFloat(order?.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">VAT (2.5%):</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦${parseFloat(order?.vat_amount || 0).toFixed(2)}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">TOTAL AMOUNT:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold; font-size: 1.2em;">₦${parseFloat(order?.total_amount || 0).toFixed(2)}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="4" style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-weight: bold; font-style: italic;">
                Amount in Words: ${numberToWords(parseFloat(order?.total_amount || 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-weight: bold;">Payment Instructions:</p>
        <p style="margin: 5px 0 10px 0;">Please make payment to any of the following accounts:</p>
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Account Details:</p>
          <p style="margin: 5px 0;"><strong>Account Name:</strong> BONNESANTE MEDICALS</p>
          <p style="margin: 5px 0;"><strong>Account 1:</strong> 8259518195 - MONIEPOINT MICROFINANCE BANK</p>
          <p style="margin: 5px 0;"><strong>Account 2:</strong> 1379643548 - ACCESS BANK</p>
        </div>
        <p style="margin: 5px 0 0 0;"><strong>After payment:</strong> Send evidence with Order ID #${order?.id || 'N/A'} to WhatsApp: +234 707 679 3866</p>
      </div>
      
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-top: 15px;">
        <p style="margin: 0; font-weight: bold; color: #1e40af;">📋 Order Confirmation Required:</p>
        <p style="margin: 5px 0 0 0; color: #1e40af;">Please review all order details above and confirm/acknowledge that your order was correctly captured before proceeding with payment.</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 10px; color: #6b7280; font-size: 12px;">
        <p>Thank you for choosing ASTRO-BSM Professional Medical Supplies</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button id="exportOrderBtn" class="btn-secondary" style="margin-right: 10px;">
        📄 Export as JPG
      </button>
      <button id="shareEmailBtn" class="btn-secondary" style="margin-right: 10px;">
        📧 Share via Email
      </button>
      <button id="shareWhatsAppBtn" class="btn-secondary" style="margin-right: 10px;">
        📱 Share to WhatsApp
      </button>
      <button id="printOrderBtn" class="btn-secondary">
        🖨️ Print Order
      </button>
    </div>
  `;
  
  orderSummary.innerHTML = summary;
  orderSummary.style.display = 'block';
  orderSummary.classList.add('fade-in');
  
  // Add export functionality
  document.getElementById('exportOrderBtn').addEventListener('click', () => {
    exportOrderAsJPG(customerData, orderData);
  });
  
  // Add email sharing functionality
  document.getElementById('shareEmailBtn').addEventListener('click', () => {
    shareViaEmail(customerData, orderData);
  });
  
  // Add WhatsApp sharing functionality
  document.getElementById('shareWhatsAppBtn').addEventListener('click', () => {
    shareViaWhatsApp(customerData, orderData);
  });
  
  // Add print functionality
  document.getElementById('printOrderBtn').addEventListener('click', () => {
    printOrder();
  });
  
  // Scroll to summary
  orderSummary.scrollIntoView({ behavior: 'smooth' });
}

// Export order as JPG
async function exportOrderAsJPG(customerData, orderData) {
  const exportBtn = document.getElementById('exportOrderBtn');
  const originalText = exportBtn.textContent;
  
  try {
    exportBtn.textContent = '⏳ Generating...';
    exportBtn.disabled = true;
    
    const exportableContent = document.getElementById('exportableContent');
    
    // Use html2canvas to convert HTML to canvas
    const canvas = await html2canvas(exportableContent, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      width: exportableContent.scrollWidth,
      height: exportableContent.scrollHeight
    });
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename: ASTRO-BSM_Order_CustomerName_Date.jpg
      const orderDate = new Date(orderData.delivery_date).toISOString().split('T')[0];
      const customerName = customerData.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `ASTRO-BSM_Order_${customerName}_${orderDate}.jpg`;
      
      link.href = url;
      link.download = filename;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      exportBtn.textContent = '✅ Downloaded!';
      setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
      }, 2000);
      
    }, 'image/jpeg', 0.9);
    
  } catch (error) {
    console.error('Error exporting order:', error);
    alert('Error exporting order. Please try again.');
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
  }
}

// Share via Email
async function shareViaEmail(customerData, orderData) {
  const emailBtn = document.getElementById('shareEmailBtn');
  const originalText = emailBtn.textContent;
  
  try {
    emailBtn.textContent = '⏳ Preparing...';
    emailBtn.disabled = true;
    
    const exportableContent = document.getElementById('exportableContent');
    
    // Generate the image
    const canvas = await html2canvas(exportableContent, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: exportableContent.scrollWidth,
      height: exportableContent.scrollHeight
    });
    
    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Generate email content
    const orderDate = new Date(orderData.delivery_date).toLocaleDateString();
    const subject = `ASTRO-BSM Order Confirmation - ${customerData.name}`;
    const body = `Dear ${customerData.name},

Thank you for your order with ASTRO-BSM Professional Medical Supplies!

Order Details:
- Customer: ${customerData.name}
- Phone: ${customerData.phone}
- Delivery Date: ${orderDate}
- Delivery Address: ${customerData.delivery_address}

Your order confirmation is attached as an image.

🔍 IMPORTANT: Please review the attached order details carefully and confirm/acknowledge that your order was correctly captured.

💰 PAYMENT INSTRUCTIONS:
Please make payment to any of these accounts:

ACCOUNT NAME: BONNESANTE MEDICALS
Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK
Account 2: 1379643548 - ACCESS BANK

After payment, send evidence with Order ID to WhatsApp: +234 707 679 3866

If you notice any discrepancies in your order, please contact us immediately.

Best regards,
ASTRO-BSM Team
Professional Medical Supplies`;

    // Create mailto link with image data
    const mailtoLink = `mailto:${customerData.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // For modern browsers, try to share with image
    if (navigator.share && navigator.canShare) {
      // Convert data URL to blob for sharing
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `ASTRO-BSM_Order_${customerData.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: subject,
          text: body,
          files: [file]
        });
        
        emailBtn.textContent = '✅ Shared!';
        setTimeout(() => {
          emailBtn.textContent = originalText;
          emailBtn.disabled = false;
        }, 2000);
        return;
      }
    }
    
    // Fallback: Open email client
    window.open(mailtoLink, '_blank');
    
    // Also download the image for manual attachment
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `ASTRO-BSM_Order_${customerData.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    link.click();
    
    emailBtn.textContent = '📧 Email Opened';
    setTimeout(() => {
      emailBtn.textContent = originalText;
      emailBtn.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error sharing via email:', error);
    alert('Error preparing email. Please try the download option instead.');
    emailBtn.textContent = originalText;
    emailBtn.disabled = false;
  }
}

// Share via WhatsApp
async function shareViaWhatsApp(customerData, orderData) {
  const whatsappBtn = document.getElementById('shareWhatsAppBtn');
  const originalText = whatsappBtn.textContent;
  
  try {
    whatsappBtn.textContent = '⏳ Preparing...';
    whatsappBtn.disabled = true;
    
    const exportableContent = document.getElementById('exportableContent');
    
    // Generate the image
    const canvas = await html2canvas(exportableContent, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: exportableContent.scrollWidth,
      height: exportableContent.scrollHeight
    });
    
    // Generate WhatsApp message text
    const orderDate = new Date(orderData.delivery_date).toLocaleDateString();
    const message = `🏥 *ASTRO-BSM Order Confirmation*

📋 *Order Details:*
👤 Customer: ${customerData.name}
📞 Phone: ${customerData.phone}
📅 Delivery Date: ${orderDate}
📍 Address: ${customerData.delivery_address}

✅ Your order has been confirmed!

� *IMPORTANT:* Please review the attached order details carefully and confirm/acknowledge that your order was correctly captured.

�💰 *Next Steps:*
Please send payment evidence with your order ID to this WhatsApp number: +234 707 679 3866

❗ If you notice any discrepancies in your order, please contact us immediately.

Thank you for choosing ASTRO-BSM Professional Medical Supplies! 🙏`;

    // For modern browsers with Web Share API
    if (navigator.share && navigator.canShare) {
      try {
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        
        const file = new File([blob], `ASTRO-BSM_Order_${customerData.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'ASTRO-BSM Order Confirmation',
            text: message,
            files: [file]
          });
          
          whatsappBtn.textContent = '✅ Shared!';
          setTimeout(() => {
            whatsappBtn.textContent = originalText;
            whatsappBtn.disabled = false;
          }, 2000);
          return;
        }
      } catch (shareError) {
        console.log('Web Share API failed, falling back to WhatsApp Web');
      }
    }
    
    // Fallback: Open WhatsApp Web with text message
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Also download the image for manual sharing
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `ASTRO-BSM_Order_${customerData.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);
    
    whatsappBtn.textContent = '📱 WhatsApp Opened';
    setTimeout(() => {
      whatsappBtn.textContent = originalText;
      whatsappBtn.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error sharing via WhatsApp:', error);
    alert('Error preparing WhatsApp share. Please try the download option instead.');
    whatsappBtn.textContent = originalText;
    whatsappBtn.disabled = false;
  }
}

// Print order
function printOrder() {
  const exportableContent = document.getElementById('exportableContent');
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ASTRO-BSM Order</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${exportableContent.innerHTML}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

// Load product management
async function loadProductManagement() {
  try {
    // Reload products from database to ensure we have fresh data
    await loadProducts();
    
    // Show existing products
    const productsList = document.getElementById('productsList');
    if (productsList) {
      if (productList.length === 0) {
        productsList.innerHTML = '<p class="no-products">No products found. Add some products to get started.</p>';
        return;
      }
      
      let productsHtml = '<h3>Current Products:</h3>';
      productList.forEach((product, index) => {
        const price = product.price || product.unit_price || 0;
        productsHtml += `
          <div class="product-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
            <div>
              <strong>${product.name}</strong><br>
              <small>Price: ₦${parseFloat(price).toFixed(2)}</small><br>
              <small>ID: ${product.id}</small>
            </div>
            <div>
              <button class="btn-edit-product btn-secondary" data-product-index="${index}">Edit</button>
              <button class="btn-delete-product btn-danger" data-product-index="${index}">Delete</button>
            </div>
          </div>
        `;
      });
      productsList.innerHTML = productsHtml;
    }
  } catch (error) {
    console.error('Error loading product management:', error);
    const productsList = document.getElementById('productsList');
    if (productsList) {
      productsList.innerHTML = '<p class="error">Error loading products. Please try again.</p>';
    }
  }
}

// Edit product
function editProduct(index) {
  const product = productList[index];
  const nameInput = document.getElementById('newProductName');
  const priceInput = document.getElementById('newProductPrice');
  const descInput = document.getElementById('newProductDescription');
  const addForm = document.getElementById('addProductForm');
  
  if (nameInput && priceInput && addForm) {
    nameInput.value = product.name;
    priceInput.value = product.price || product.unit_price || 0;
    if (descInput) {
      descInput.value = product.description || '';
    }
    descInput.value = product.description || '';
    addForm.style.display = 'block';
    
    // Update save button to edit mode
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
      saveBtn.onclick = () => saveProduct(index);
      saveBtn.textContent = 'Update Product';
    }
  }
}

// Delete product
async function deleteProduct(index) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      const product = productList[index];
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        productList.splice(index, 1);
        loadProductManagement();
        alert('Product deleted successfully');
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + error.message);
    }
  }
}

// Save product (add or update)
async function saveProduct(editIndex = null) {
  const nameInput = document.getElementById('newProductName');
  const priceInput = document.getElementById('newProductPrice');
  const descInput = document.getElementById('newProductDescription');
  
  if (!nameInput || !priceInput) return;
  
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description = descInput.value.trim();
  
  if (!name || !price || price <= 0) {
    alert('Please enter valid product name and price');
    return;
  }
  
  try {
    const productData = {
      name: name,
      unit_price: price,
      description: description
    };
    
    let response;
    if (editIndex !== null) {
      // Update existing product
      const product = productList[editIndex];
      response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    } else {
      // Add new product
      response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    }
    
    if (response.ok) {
      // Refresh product list
      await loadProducts();
      loadProductManagement();
      
      // Reset form
      nameInput.value = '';
      priceInput.value = '';
      descInput.value = '';
      
      // Hide form
      const addForm = document.getElementById('addProductForm');
      if (addForm) addForm.style.display = 'none';
      
      // Reset save button
      const saveBtn = document.getElementById('saveProductBtn');
      if (saveBtn) {
        saveBtn.onclick = () => saveProduct();
        saveBtn.textContent = 'Save Product';
      }
      
      alert(editIndex !== null ? 'Product updated successfully' : 'Product added successfully');
    } else {
      throw new Error('Failed to save product');
    }
  } catch (error) {
    console.error('Error saving product:', error);
    alert('Error saving product: ' + error.message);
  }
}

// Load all orders function
async function loadAllOrders() {
  try {
    ordersList.innerHTML = '<p>Loading orders...</p>';
    
    const response = await fetch(`${API_BASE_URL}/orders`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const orders = await response.json();
    
    if (orders.length === 0) {
      ordersList.innerHTML = '<p>No orders found.</p>';
      return;
    }
    
    const deliveryMethodNames = {
      'pickup_enugu': 'Pickup from Enugu Office',
      'delivery_enugu': 'Home Delivery within Enugu',
      'transport_bus': 'Transport Bus (Interstate)',
      'courier_service': 'Courier Service',
      'airline_cargo': 'Airline Cargo',
      'personal_arrangement': 'Personal Arrangement'
    };
    
    const urgencyNames = {
      'can_wait_24hrs': 'Can wait for 24 hours',
      'urgent': 'Urgent',
      'very_urgent': 'Very Urgent'
    };
    
    let ordersHtml = '';
    for (const order of orders) {
      // Fetch order items
      const itemsResponse = await fetch(`${API_BASE_URL}/orders/${order.id}`);
      const orderWithItems = await itemsResponse.json();
      
      ordersHtml += `
        <div class="order-card" id="order-${order.id}">
          <div class="order-header">
            <span class="order-id">Order #${order.id}</span>
            <span class="order-status status-${order.status}">${order.status}</span>
            <span class="urgency-badge urgency-${order.request_status}">${urgencyNames[order.request_status] || order.request_status}</span>
            <div class="export-buttons">
              <button class="btn-export-pdf" data-order-id="${order.id}" data-customer-name="${order.customer_name}">
                📄 Export PDF
              </button>
              <button class="btn-generate-invoice" data-order-id="${order.id}">
                📄 Generate Invoice
              </button>
            </div>
          </div>
          <div class="order-details">
            <div><strong>Customer:</strong> ${order.customer_name}</div>
            <div><strong>Email:</strong> Not provided</div>
            <div><strong>Phone:</strong> ${order.phone || 'Not provided'}</div>
            <div><strong>Total:</strong> ₦${calculateOrderTotalFromItems(orderWithItems.items || [])}</div>
            <div><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
            <div><strong>Delivery Date:</strong> Not specified</div>
            <div><strong>Delivery Method:</strong> Not specified</div>
            <div><strong>Address:</strong> ${order.address || 'Not provided'}</div>
          </div>
          <div class="order-items">
            <strong>Items:</strong>
            <ul>
              ${orderWithItems.items ? orderWithItems.items.map(item => 
                `<li>${item.product_name} - Qty: ${item.quantity} @ ₦${parseFloat(item.price || 0).toFixed(2)}</li>`
              ).join('') : 'No items found'}
            </ul>
          </div>
        </div>
      `;
    }
    
    ordersList.innerHTML = ordersHtml;
    
  } catch (error) {
    console.error('Error loading orders:', error);
    ordersList.innerHTML = '<p>Error loading orders. Please try again.</p>';
  }
}

// Initialize app
window.addEventListener('load', async () => {
  await loadProducts();
  createItemRow(); // Create first item row
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('deliveryDate').min = today;
});

// Product Management Functions
async function loadProductsForManagement() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products for management');
    }
    
    const products = await response.json();
    displayProductsList(products);
  } catch (error) {
    console.error('Error loading products for management:', error);
    document.getElementById('productsList').innerHTML = '<p>Error loading products.</p>';
  }
}

function displayProductsList(products) {
  const productsList = document.getElementById('productsList');
  
  if (products.length === 0) {
    productsList.innerHTML = '<p>No products found.</p>';
    return;
  }
  
  let html = '';
  products.forEach(product => {
    html += `
      <div class="product-item" data-id="${product.id}">
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-price">₦${product.price}</div>
          ${product.description ? `<div style="color: #6b7280; font-size: 0.9em;">${product.description}</div>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-edit-admin-product" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-description="${product.description || ''}">Edit</button>
          <button class="btn-delete-admin-product" data-product-id="${product.id}" data-product-name="${product.name}">Delete</button>
        </div>
      </div>
    `;
  });
  
  productsList.innerHTML = html;
}

async function saveNewProduct() {
  const name = document.getElementById('newProductName').value.trim();
  const price = parseFloat(document.getElementById('newProductPrice').value);
  const description = document.getElementById('newProductDescription').value.trim();
  
  if (!name || !price || price <= 0) {
    alert('Please enter valid product name and price.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        price,
        description,
        adminPassword: 'roseball'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add product');
    }
    
    // Refresh products list and reload for main form
    await loadProductsForManagement();
    await loadProducts();
    
    // Clear form and hide it
    clearProductForm();
    document.getElementById('addProductForm').style.display = 'none';
    
    alert('Product added successfully!');
  } catch (error) {
    console.error('Error adding product:', error);
    alert('Error adding product: ' + error.message);
  }
}

function editProduct(id, name, price, description) {
  const newName = prompt('Enter new product name:', name);
  if (newName === null) return;
  
  const newPrice = prompt('Enter new price:', price);
  if (newPrice === null) return;
  
  const priceValue = parseFloat(newPrice);
  if (isNaN(priceValue) || priceValue <= 0) {
    alert('Please enter a valid price.');
    return;
  }
  
  // Check if price is being changed
  let pricePassword = '';
  if (priceValue !== price) {
    pricePassword = prompt('Price change requires additional password:');
    if (pricePassword === null) return;
  }
  
  const newDescription = prompt('Enter description (optional):', description);
  if (newDescription === null) return;
  
  updateProduct(id, newName.trim(), priceValue, newDescription.trim(), pricePassword);
}

async function updateProduct(id, name, price, description, pricePassword) {
  try {
    const body = {
      name,
      price,
      description,
      adminPassword: 'roseball'
    };
    
    if (pricePassword) {
      body.pricePassword = pricePassword;
    }
    
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    
    // Refresh products list and reload for main form
    await loadProductsForManagement();
    await loadProducts();
    
    alert('Product updated successfully!');
  } catch (error) {
    console.error('Error updating product:', error);
    alert('Error updating product: ' + error.message);
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: 'roseball'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    
    // Refresh products list and reload for main form
    await loadProductsForManagement();
    await loadProducts();
    
    alert('Product deleted successfully!');
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Error deleting product: ' + error.message);
  }
}

function clearProductForm() {
  document.getElementById('newProductName').value = '';
  document.getElementById('newProductPrice').value = '';
  document.getElementById('newProductDescription').value = '';
}

// Export order as PDF
async function exportOrderAsPDF(orderId, customerName) {
  try {
    // Fetch the complete order data
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order data');
    }
    
    const orderData = await response.json();
    console.log('Order data for PDF:', orderData);
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Company header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('ASTRO-BSM PROFESSIONAL MEDICAL SUPPLIES', 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Equipment • Laboratory Supplies • Healthcare Solutions', 20, 35);
    
    // Order title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`ORDER CONFIRMATION #${orderId}`, 20, 55);
    
    // Customer information
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    let yPos = 75;
    
    doc.text('CUSTOMER INFORMATION:', 20, yPos);
    yPos += 10;
    doc.text(`Name: ${orderData.customer_name}`, 25, yPos);
    yPos += 8;
    if (orderData.email) {
      doc.text(`Email: ${orderData.email}`, 25, yPos);
      yPos += 8;
    }
    doc.text(`Phone: ${orderData.phone}`, 25, yPos);
    yPos += 8;
    doc.text(`Address: ${orderData.address || 'Not provided'}`, 25, yPos);
    yPos += 8;
    if (orderData.company) {
      doc.text(`Company: ${orderData.company}`, 25, yPos);
      yPos += 8;
    }
    
    // Order details
    yPos += 5;
    doc.text('ORDER DETAILS:', 20, yPos);
    yPos += 10;
    doc.text(`Order Date: ${new Date(orderData.created_at).toLocaleDateString()}`, 25, yPos);
    yPos += 8;
    if (orderData.delivery_date) {
      doc.text(`Delivery Date: ${new Date(orderData.delivery_date).toLocaleDateString()}`, 25, yPos);
      yPos += 8;
    }
    if (orderData.preferred_delivery_method) {
      const deliveryMethodNames = {
        'pickup': 'Pickup from Store',
        'delivery': 'Home/Office Delivery',
        'shipping': 'Courier Shipping'
      };
      doc.text(`Delivery Method: ${deliveryMethodNames[orderData.preferred_delivery_method] || orderData.preferred_delivery_method}`, 25, yPos);
      yPos += 8;
    }
    if (orderData.delivery_route) {
      doc.text(`Delivery Instructions: ${orderData.delivery_route}`, 25, yPos);
      yPos += 8;
    }
    if (orderData.request_status) {
      const urgencyNames = {
        'can_wait_24hrs': 'Can wait for 24 hours',
        'urgent': 'Urgent',
        'very_urgent': 'Very Urgent'
      };
      doc.text(`Urgency: ${urgencyNames[orderData.request_status] || orderData.request_status}`, 25, yPos);
      yPos += 8;
    }
    
    // Items table header
    yPos += 10;
    doc.text('ORDERED ITEMS:', 20, yPos);
    yPos += 10;
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setTextColor(40, 40, 40);
    doc.text('Item', 25, yPos + 6);
    doc.text('Qty', 120, yPos + 6);
    doc.text('Unit Price', 140, yPos + 6);
    doc.text('Total', 170, yPos + 6);
    yPos += 15;
    
    // Items
    let subtotal = 0;
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach(item => {
        const price = parseFloat(item.price || item.unit_price || 0);
        const itemTotal = price * parseInt(item.quantity);
        subtotal += itemTotal;
        
        doc.text(item.product_name, 25, yPos);
        doc.text(item.quantity.toString(), 125, yPos);
        doc.text(`₦${price.toFixed(2)}`, 140, yPos);
        doc.text(`₦${itemTotal.toFixed(2)}`, 170, yPos);
        yPos += 8;
      });
    }
    
    // Totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos); // Horizontal line
    yPos += 10;
    
    const vat = subtotal * 0.025;
    const total = subtotal + vat;
    
    doc.text('Subtotal:', 140, yPos);
    doc.text(`₦${subtotal.toFixed(2)}`, 170, yPos);
    yPos += 8;
    doc.text('VAT (2.5%):', 140, yPos);
    doc.text(`₦${vat.toFixed(2)}`, 170, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`₦${total.toFixed(2)}`, 170, yPos);
    
    // Payment instructions
    yPos += 20;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('PAYMENT INSTRUCTIONS:', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.text('Please make payment to any of these accounts:', 25, yPos);
    yPos += 8;
    doc.text('ACCOUNT NAME: BONNESANTE MEDICALS', 25, yPos);
    yPos += 6;
    doc.text('Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK', 25, yPos);
    yPos += 6;
    doc.text('Account 2: 2402979199 - ZENITH BANK', 25, yPos);
    yPos += 6;
    doc.text('Account 3: 0110395969 - GTBANK', 25, yPos);
    
    // Footer
    yPos += 15;
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing ASTRO-BSM Professional Medical Supplies!', 20, yPos);
    yPos += 6;
    doc.text('For inquiries, contact us at: info@astrobsm.com', 20, yPos);
    
    // Generate filename and save
    const orderDate = new Date(orderData.created_at).toISOString().split('T')[0];
    const safeCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ASTRO-BSM_Order_${orderId}_${safeCustomerName}_${orderDate}.pdf`;
    
    doc.save(filename);
    
    // Show success message
    const btn = document.querySelector(`button[onclick*="exportOrderAsPDF(${orderId}"]`);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✅ Downloaded!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 3000);
    }
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF: ' + error.message);
  }
}

// Generate Invoice for Order ID
async function generateInvoiceForOrder(orderId) {
  try {
    // Find the order from the current orders list
    const order = window.currentOrders?.find(o => o.id === orderId);
    if (!order) {
      alert('Order not found');
      return;
    }
    
    // Fetch complete order details with items
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    
    const orderWithItems = await response.json();
    generateInvoice(orderWithItems);
    
  } catch (error) {
    console.error('Error generating invoice:', error);
    alert('Failed to generate invoice. Please try again.');
  }
}

// Generate Invoice Function
function generateInvoice(order) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Company Header
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('ASTRO-BSM', 105, 30, null, null, 'center');
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text('Business Solutions & Management', 105, 40, null, null, 'center');
  pdf.text('Professional Order Management System', 105, 50, null, null, 'center');
  
  // Invoice Details
  pdf.setFont(undefined, 'bold');
  pdf.text('INVOICE', 20, 70);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Invoice #: INV-${order.id || 'N/A'}`, 20, 80);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);
  pdf.text(`Order Date: ${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}`, 20, 100);
  
  // Customer Information
  pdf.setFont(undefined, 'bold');
  pdf.text('Bill To:', 20, 120);
  pdf.setFont(undefined, 'normal');
  pdf.text(`${order.customer_name || 'N/A'}`, 20, 130);
  pdf.text(`${order.email || 'N/A'}`, 20, 140);
  pdf.text(`${order.phone || 'N/A'}`, 20, 150);
  pdf.text(`${order.address || 'N/A'}`, 20, 160);
  
  // Order Items Table Header
  pdf.setFont(undefined, 'bold');
  pdf.text('Item', 20, 180);
  pdf.text('Qty', 100, 180);
  pdf.text('Price', 130, 180);
  pdf.text('Total', 160, 180);
  
  // Draw line under header
  pdf.line(20, 185, 190, 185);
  
  // Order Items
  pdf.setFont(undefined, 'normal');
  let yPos = 195;
  let itemTotal = 0;
  
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity) || 1;
      const lineTotal = itemPrice * itemQty;
      itemTotal += lineTotal;
      
      pdf.text(`${item.name || 'N/A'}`, 20, yPos);
      pdf.text(`${itemQty}`, 100, yPos);
      pdf.text(`₦${itemPrice.toFixed(2)}`, 130, yPos);
      pdf.text(`₦${lineTotal.toFixed(2)}`, 160, yPos);
      yPos += 10;
    });
  }
  
  // Totals Section
  yPos += 10;
  pdf.line(130, yPos, 190, yPos); // Line above totals
  yPos += 10;
  
  const subtotal = parseFloat(order.subtotal) || itemTotal;
  const vat = parseFloat(order.vat) || (subtotal * 0.075);
  const total = parseFloat(order.total) || (subtotal + vat);
  
  pdf.text('Subtotal:', 130, yPos);
  pdf.text(`₦${subtotal.toFixed(2)}`, 160, yPos);
  yPos += 10;
  
  pdf.text('VAT (7.5%):', 130, yPos);
  pdf.text(`₦${vat.toFixed(2)}`, 160, yPos);
  yPos += 10;
  
  pdf.setFont(undefined, 'bold');
  pdf.text('Total:', 130, yPos);
  pdf.text(`₦${total.toFixed(2)}`, 160, yPos);
  
  // Payment Information
  yPos += 20;
  pdf.setFont(undefined, 'bold');
  pdf.text('Payment Information:', 20, yPos);
  pdf.setFont(undefined, 'normal');
  yPos += 10;
  pdf.text('Account Name: BONNESANTE MEDICALS', 20, yPos);
  yPos += 10;
  pdf.text('Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK', 20, yPos);
  yPos += 10;
  pdf.text('Account 2: 1379643548 - ACCESS BANK', 20, yPos);
  
  // Footer
  yPos += 20;
  pdf.setFontSize(10);
  pdf.text('Thank you for your business!', 105, yPos, null, null, 'center');
  yPos += 10;
  pdf.text('For inquiries, contact us at info@astro-bsm.com', 105, yPos, null, null, 'center');
  
  // Save PDF with customer name
  const customerName = (order.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Invoice_${customerName}_${order.id || 'N/A'}.pdf`;
  pdf.save(fileName);
}

// Setup event listeners for dynamically created buttons
function setupDynamicEventListeners() {
  // Use event delegation for admin panel export buttons
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-export-pdf')) {
      const orderId = e.target.getAttribute('data-order-id');
      const customerName = e.target.getAttribute('data-customer-name');
      exportOrderAsPDF(parseInt(orderId), customerName);
    }
    
    if (e.target.matches('.btn-generate-invoice')) {
      const orderId = e.target.getAttribute('data-order-id');
      generateInvoiceForOrder(parseInt(orderId));
    }
    
    // Product management buttons in admin quick products
    if (e.target.matches('.btn-edit-product')) {
      const index = e.target.getAttribute('data-product-index');
      editProduct(parseInt(index));
    }
    
    if (e.target.matches('.btn-delete-product')) {
      const index = e.target.getAttribute('data-product-index');
      deleteProduct(parseInt(index));
    }
    
    // Product management buttons in admin products management
    if (e.target.matches('.btn-edit-admin-product')) {
      const id = e.target.getAttribute('data-product-id');
      const name = e.target.getAttribute('data-product-name');
      const price = e.target.getAttribute('data-product-price');
      const description = e.target.getAttribute('data-product-description');
      editProduct(parseInt(id), name, parseFloat(price), description);
    }
    
    if (e.target.matches('.btn-delete-admin-product')) {
      const id = e.target.getAttribute('data-product-id');
      const name = e.target.getAttribute('data-product-name');
      deleteProduct(parseInt(id), name);
    }
  });
}

// PWA: Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
