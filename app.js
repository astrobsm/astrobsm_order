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
const ordersSection = document.getElementById('ordersSection');
const ordersList = document.getElementById('ordersList');

// Notification System Variables
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');
const notificationCenter = document.getElementById('notificationCenter');
const closeNotifications = document.getElementById('closeNotifications');
const notificationsList = document.getElementById('notificationsList');
const notificationsContent = document.getElementById('notificationsContent');
const clearAllNotifications = document.getElementById('clearAllNotifications');
const markAllRead = document.getElementById('markAllRead');

// Notification State
let notifications = [];
let notificationInterval = null;

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
    
    // Set up admin functionality - Role-based access
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        if (!authManager.canAccess('view_all_orders')) {
          alert('Access denied. You do not have permission to view the admin panel.');
          return;
        }
        
        if (adminModal) {
          adminModal.style.display = 'block';
          // Directly show orders section for authorized users
          if (ordersSection) ordersSection.style.display = 'block';
          loadAllOrders();
        }
      });
    }
    
    // Set up logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
          authManager.logout();
        }
      });
    }
    
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        if (adminModal) adminModal.style.display = 'none';
        if (ordersSection) ordersSection.style.display = 'none';
      });
    }
    
    window.addEventListener('click', (event) => {
      if (event.target === adminModal) {
        if (adminModal) adminModal.style.display = 'none';
        if (ordersSection) ordersSection.style.display = 'none';
      }
      if (productModal && event.target === productModal) {
        productModal.style.display = 'none';
      }
    });
    
    // Set up Product Management button - Role-based access
    const manageProductsBtn = document.getElementById('manageProductsBtn');
    if (manageProductsBtn) {
      manageProductsBtn.addEventListener('click', () => {
        if (!authManager.canAccess('manage_products')) {
          alert('Access denied. You do not have permission to manage products.');
          return;
        }
        
        if (productModal) {
          productModal.style.display = 'block';
          loadProductManagement();
        }
      });
    }

    // Set up Stock Management button - Role-based access
    const manageStockBtn = document.getElementById('manageStockBtn');
    if (manageStockBtn) {
      manageStockBtn.addEventListener('click', () => {
        if (!authManager.canAccess('manage_stock')) {
          alert('Access denied. You do not have permission to manage stock.');
          return;
        }
        
        showStockManagement();
      });
    }

    // Set up User Management button - Superadmin only
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    if (manageUsersBtn) {
      manageUsersBtn.addEventListener('click', () => {
        if (!authManager.canAccess('manage_users')) {
          alert('Access denied. Only superadmins can manage users.');
          return;
        }
        
        showUserManagement();
      });
    }

    // Set up Stock Management navigation buttons
    const backToOrders = document.getElementById('backToOrders');
    if (backToOrders) {
      backToOrders.addEventListener('click', () => {
        hideStockManagement();
      });
    }

    const viewStockLevels = document.getElementById('viewStockLevels');
    if (viewStockLevels) {
      viewStockLevels.addEventListener('click', () => {
        loadStockLevels();
      });
    }

    const addStockIntake = document.getElementById('addStockIntake');
    if (addStockIntake) {
      addStockIntake.addEventListener('click', () => {
        showStockIntakeForm();
      });
    }

    const viewStockAlerts = document.getElementById('viewStockAlerts');
    if (viewStockAlerts) {
      viewStockAlerts.addEventListener('click', () => {
        loadStockAlerts();
      });
    }

    const submitStockIntake = document.getElementById('submitStockIntake');
    if (submitStockIntake) {
      submitStockIntake.addEventListener('click', () => {
        submitStockIntake();
      });
    }

    const cancelStockIntake = document.getElementById('cancelStockIntake');
    if (cancelStockIntake) {
      cancelStockIntake.addEventListener('click', () => {
        document.getElementById('stockIntakeForm').style.display = 'none';
        loadStockLevels();
      });
    }

    // Set up Product Management form buttons
    const addProductBtn = document.getElementById('addProductBtn');
    let saveProductBtn = document.getElementById('saveProductBtn');
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
          // Remove existing listeners and add new one
          saveProductBtn.replaceWith(saveProductBtn.cloneNode(true));
          saveProductBtn = document.getElementById('saveProductBtn');
          saveProductBtn.addEventListener('click', () => saveProduct());
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
    
    // Initialize notification system
    initializeNotificationSystem();
    
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
    
    // Create notification for new order
    const orderTotal = calculateOrderTotal().total;
    createNotification(result.order.id, customerData.name, orderTotal.toFixed(2));
    
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
          <p><strong>Email:</strong> ${customerData.email || 'Not provided'}</p>
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
      <button id="thermalPrintBtn" class="btn-secondary">
        🎟️ Thermal Print (58mm)
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
  
  // Add thermal print functionality
  document.getElementById('thermalPrintBtn').addEventListener('click', () => {
    thermalPrintOrder(customerData, orderData, items, order);
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

// Thermal print functionality for XP-P300 (58mm)
function thermalPrintOrder(customerData, orderData, items, order) {
  // Create thermal print content
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  
  const thermalContent = generateThermalPrintContent(customerData, orderData, items, order);
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Order Summary - ASTRO-BSM</title>
      <link rel="stylesheet" href="thermal-print.css">
      <style>
        body { margin: 0; padding: 0; font-family: monospace; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${thermalContent}
      <div class="no-print" style="text-align: center; margin: 20px;">
        <button id="printBtn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Print Receipt</button>
        <button id="closeBtn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        <script>
          document.getElementById('printBtn').addEventListener('click', () => window.print());
          document.getElementById('closeBtn').addEventListener('click', () => window.close());
        </script>
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Auto-print after a short delay
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

function generateThermalPrintContent(customerData, orderData, items, order) {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  
  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  
  return `
    <div class="thermal-receipt">
      <!-- Header -->
      <div class="receipt-header">
        <div class="company-name">ASTRO-BSM</div>
        <div class="company-info">Order Management System</div>
        <div class="separator">================================</div>
      </div>
      
      <!-- Order Info -->
      <div class="receipt-section">
        <div class="section-title">ORDER DETAILS</div>
        <div class="info-line">Order #: ${order.id || 'N/A'}</div>
        <div class="info-line">Date: ${currentDate}</div>
        <div class="info-line">Time: ${currentTime}</div>
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Customer Info -->
      <div class="receipt-section">
        <div class="section-title">CUSTOMER INFO</div>
        <div class="info-line">Name: ${customerData.name}</div>
        <div class="info-line">Phone: ${customerData.phone}</div>
        <div class="info-line">Email: ${customerData.email}</div>
        ${customerData.address ? `<div class="info-line">Address: ${customerData.address}</div>` : ''}
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Items -->
      <div class="receipt-section">
        <div class="section-title">ORDER ITEMS</div>
        ${items.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
              ${item.quantity}x @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        `).join('')}
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Totals -->
      <div class="receipt-section">
        <div class="total-line">Subtotal: $${subtotal.toFixed(2)}</div>
        <div class="total-line">Tax (10%): $${tax.toFixed(2)}</div>
        <div class="total-line total-final">TOTAL: $${total.toFixed(2)}</div>
        <div class="separator">================================</div>
      </div>
      
      <!-- Footer -->
      <div class="receipt-footer">
        <div class="footer-text">Thank you for your business!</div>
        <div class="footer-text">ASTRO-BSM Order System</div>
        <div class="footer-text">Powered by Order Management</div>
      </div>
      
      <!-- QR Code Placeholder -->
      <div class="qr-section">
        <div class="qr-placeholder">[QR Code: Order ${order.id || 'N/A'}]</div>
      </div>
    </div>
  `;
}

// Thermal print order by ID
async function thermalPrintOrderById(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    const orderData = await response.json();
    
    if (!response.ok) {
      throw new Error(orderData.message || 'Failed to fetch order');
    }

    // Create customer data object
    const customerData = {
      name: orderData.customer_name,
      phone: orderData.phone || 'Not provided',
      email: orderData.email || 'Not provided',
      address: orderData.address || ''
    };

    // Create order data object
    const order = {
      id: orderData.id,
      status: orderData.status,
      delivery_date: orderData.delivery_date,
      created_at: orderData.created_at
    };

    // Use order items directly
    const items = orderData.items || [];

    thermalPrintOrder(customerData, orderData, items, order);
  } catch (error) {
    console.error('Error printing order:', error);
    alert('Failed to print order. Please try again.');
  }
}

// Thermal print invoice by ID
async function thermalPrintInvoiceById(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    const orderData = await response.json();
    
    if (!response.ok) {
      throw new Error(orderData.message || 'Failed to fetch order');
    }

    // Create invoice content
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    const invoiceContent = generateThermalInvoiceContent(orderData);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ASTRO-BSM</title>
        <link rel="stylesheet" href="thermal-print.css">
        <style>
          body { margin: 0; padding: 0; font-family: monospace; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${invoiceContent}
        <div class="no-print" style="text-align: center; margin: 20px;">
          <button id="printInvoiceBtn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Print Invoice</button>
          <button id="closeInvoiceBtn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          <script>
            document.getElementById('printInvoiceBtn').addEventListener('click', () => window.print());
            document.getElementById('closeInvoiceBtn').addEventListener('click', () => window.close());
          </script>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
    
  } catch (error) {
    console.error('Error printing invoice:', error);
    alert('Failed to print invoice. Please try again.');
  }
}

function generateThermalInvoiceContent(orderData) {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const orderDate = new Date(orderData.created_at).toLocaleDateString();
  
  // Calculate totals
  let subtotal = 0;
  const items = orderData.items || [];
  items.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  
  return `
    <div class="thermal-receipt">
      <!-- Header -->
      <div class="receipt-header">
        <div class="company-name">ASTRO-BSM</div>
        <div class="company-info">INVOICE</div>
        <div class="separator">================================</div>
      </div>
      
      <!-- Invoice Info -->
      <div class="receipt-section">
        <div class="section-title">INVOICE DETAILS</div>
        <div class="info-line">Invoice #: INV-${orderData.id}</div>
        <div class="info-line">Order #: ${orderData.id}</div>
        <div class="info-line">Invoice Date: ${currentDate}</div>
        <div class="info-line">Order Date: ${orderDate}</div>
        <div class="info-line">Status: ${orderData.status}</div>
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Customer Info -->
      <div class="receipt-section">
        <div class="section-title">BILL TO</div>
        <div class="info-line">Name: ${orderData.customer_name}</div>
        <div class="info-line">Phone: ${orderData.phone || 'Not provided'}</div>
        <div class="info-line">Email: ${orderData.email || 'Not provided'}</div>
        ${orderData.address ? `<div class="info-line">Address: ${orderData.address}</div>` : ''}
        ${orderData.delivery_date ? `<div class="info-line">Delivery: ${new Date(orderData.delivery_date).toLocaleDateString()}</div>` : ''}
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Items -->
      <div class="receipt-section">
        <div class="section-title">ITEMS</div>
        ${items.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
              ${item.quantity}x @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        `).join('')}
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Totals -->
      <div class="receipt-section">
        <div class="total-line">Subtotal: $${subtotal.toFixed(2)}</div>
        <div class="total-line">Tax (10%): $${tax.toFixed(2)}</div>
        <div class="total-line total-final">AMOUNT DUE: $${total.toFixed(2)}</div>
        <div class="separator">================================</div>
      </div>
      
      <!-- Payment Terms -->
      <div class="receipt-section">
        <div class="section-title">PAYMENT TERMS</div>
        <div class="info-line">Payment Due: Net 30 days</div>
        <div class="info-line">Late Fee: 1.5% per month</div>
        <div class="separator">--------------------------------</div>
      </div>
      
      <!-- Footer -->
      <div class="receipt-footer">
        <div class="footer-text">Thank you for your business!</div>
        <div class="footer-text">ASTRO-BSM</div>
        <div class="footer-text">Order Management System</div>
      </div>
      
      <!-- QR Code Placeholder -->
      <div class="qr-section">
        <div class="qr-placeholder">[QR: INV-${orderData.id}]</div>
      </div>
    </div>
  `;
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
      // Remove existing listeners and add new one
      saveBtn.replaceWith(saveBtn.cloneNode(true));
      const newSaveBtn = document.getElementById('saveProductBtn');
      newSaveBtn.addEventListener('click', () => saveProduct(index));
      newSaveBtn.textContent = 'Update Product';
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
        // Remove existing listeners and add new one
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        const newSaveBtn = document.getElementById('saveProductBtn');
        newSaveBtn.addEventListener('click', () => saveProduct());
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
    
    // Store orders globally for invoice generation
    window.currentOrders = orders;
    
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
            <span class="urgency-badge urgency-${order.request_status || 'can_wait_24hrs'}">${urgencyNames[order.request_status] || order.request_status || 'Can wait 24hrs'}</span>
            <div class="export-buttons">
              <button class="btn-export-pdf" data-order-id="${order.id}" data-customer-name="${order.customer_name}">
                📄 Export PDF
              </button>
              <button class="btn-generate-invoice" data-order-id="${order.id}">
                📄 Generate Invoice
              </button>
              <button class="btn-thermal-print-order" data-order-id="${order.id}" title="Print Order Receipt (58mm)">
                🖨️ Print Order
              </button>
              <button class="btn-thermal-print-invoice" data-order-id="${order.id}" title="Print Invoice Receipt (58mm)">
                🧾 Print Invoice
              </button>
              <button class="btn-payment-receipt" data-order-id="${order.id}" title="Generate Payment Receipt">
                💳 Payment Receipt
              </button>
            </div>
          </div>
          <div class="order-details">
            <div><strong>Customer:</strong> ${order.customer_name}</div>
            <div><strong>Email:</strong> ${order.email || 'Not provided'}</div>
            <div><strong>Phone:</strong> ${order.phone || 'Not provided'}</div>
            <div><strong>Total:</strong> ₦${calculateOrderTotalFromItems(orderWithItems.items || [])}</div>
            <div><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
            <div><strong>Delivery Date:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not specified'}</div>
            <div><strong>Delivery Method:</strong> ${deliveryMethodNames[order.preferred_delivery_method] || order.preferred_delivery_method || 'Not specified'}</div>
            <div><strong>Urgency:</strong> <span style="color: ${(order.request_status === 'very_urgent') ? '#991b1b' : (order.request_status === 'urgent') ? '#9a3412' : '#065f46'};">${urgencyNames[order.request_status] || order.request_status || 'Can wait 24hrs'}</span></div>
            <div><strong>Address:</strong> ${order.address || 'Not provided'}</div>
            ${order.delivery_route ? `<div><strong>Delivery Instructions:</strong> ${order.delivery_route}</div>` : ''}
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
        userRole: authManager.getCurrentRole()
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
  
  // Check role-based permission for price changes
  if (priceValue !== price && !authManager.canAccess('priceChanges')) {
    alert('Access denied. You do not have permission to change prices.');
    return;
  }
  
  const newDescription = prompt('Enter description (optional):', description);
  if (newDescription === null) return;
  
  updateProduct(id, newName.trim(), priceValue, newDescription.trim());
}

async function updateProduct(id, name, price, description) {
  try {
    const body = {
      name,
      price,
      description,
      userRole: authManager.getCurrentRole()
    };
    
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
        userRole: authManager.getCurrentRole()
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

// ================================
// STOCK MANAGEMENT FUNCTIONS
// ================================

// Show stock management section
function showStockManagement() {
  document.getElementById('ordersSection').style.display = 'none';
  document.getElementById('stockSection').style.display = 'block';
  loadStockLevels();
}

// Hide stock management and return to orders
function hideStockManagement() {
  document.getElementById('stockSection').style.display = 'none';
  document.getElementById('ordersSection').style.display = 'block';
  hideAllStockDisplays();
}

// Hide all stock displays
function hideAllStockDisplays() {
  document.getElementById('stockLevelsDisplay').style.display = 'none';
  document.getElementById('stockIntakeForm').style.display = 'none';
  document.getElementById('stockAlertsDisplay').style.display = 'none';
}

// Load and display stock levels
async function loadStockLevels() {
  try {
    hideAllStockDisplays();
    
    const response = await fetch(`${API_BASE_URL}/stock/levels`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock levels');
    }
    
    const result = await response.json();
    displayStockLevels(result.data);
    
    document.getElementById('stockLevelsDisplay').style.display = 'block';
    
  } catch (error) {
    console.error('Error loading stock levels:', error);
    alert('Failed to load stock levels: ' + error.message);
  }
}

// Display stock levels in a table
function displayStockLevels(stockData) {
  const container = document.getElementById('stockLevelsDisplay');
  
  let html = `
    <h4>Current Stock Levels</h4>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Current Stock</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Reorder Level</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Status</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  stockData.forEach(item => {
    const statusColor = getStockStatusColor(item.stock_status);
    const statusText = getStockStatusText(item.stock_status);
    
    html += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.current_stock || 0}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.reorder_level || 10}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <button data-action="adjust-stock" data-product-id="${item.id}" data-product-name="${item.name}" data-current-stock="${item.current_stock || 0}"
                  style="padding: 4px 8px; margin: 2px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
            Adjust
          </button>
          <button data-action="set-reorder" data-product-id="${item.id}" data-product-name="${item.name}" data-reorder-level="${item.reorder_level || 10}"
                  style="padding: 4px 8px; margin: 2px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer;">
            Reorder Level
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
    <div style="margin-top: 15px;">
      <button data-action="refresh-stock" class="btn-secondary">🔄 Refresh</button>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add event delegation for stock management buttons
  container.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'adjust-stock') {
      const productId = e.target.dataset.productId;
      const productName = e.target.dataset.productName;
      const currentStock = e.target.dataset.currentStock;
      adjustStock(productId, productName, currentStock);
    } else if (action === 'set-reorder') {
      const productId = e.target.dataset.productId;
      const productName = e.target.dataset.productName;
      const reorderLevel = e.target.dataset.reorderLevel;
      setReorderLevel(productId, productName, reorderLevel);
    } else if (action === 'refresh-stock') {
      loadStockLevels();
    }
  });
}

// Get stock status color
function getStockStatusColor(status) {
  switch(status) {
    case 'OUT_OF_STOCK': return '#dc3545';
    case 'CRITICAL': return '#fd7e14';
    case 'LOW': return '#ffc107';
    case 'GOOD': return '#28a745';
    default: return '#6c757d';
  }
}

// Get stock status text
function getStockStatusText(status) {
  switch(status) {
    case 'OUT_OF_STOCK': return '❌ Out of Stock';
    case 'CRITICAL': return '🔴 Critical';
    case 'LOW': return '🟡 Low';
    case 'GOOD': return '✅ Good';
    default: return '❓ Unknown';
  }
}

// Adjust stock level
function adjustStock(productId, productName, currentStock) {
  const newStock = prompt(`Adjust stock for "${productName}"\nCurrent Stock: ${currentStock}\nEnter new stock level:`, currentStock);
  
  if (newStock === null) return; // User cancelled
  
  const stockNumber = parseInt(newStock);
  if (isNaN(stockNumber) || stockNumber < 0) {
    alert('Please enter a valid stock number (0 or greater)');
    return;
  }
  
  const reason = prompt('Enter reason for adjustment:', 'Manual stock adjustment');
  if (reason === null) return;
  
  updateStockLevel(productId, stockNumber, reason);
}

// Set reorder level
function setReorderLevel(productId, productName, currentReorderLevel) {
  const newReorderLevel = prompt(`Set reorder level for "${productName}"\nCurrent Reorder Level: ${currentReorderLevel}\nEnter new reorder level:`, currentReorderLevel);
  
  if (newReorderLevel === null) return;
  
  const reorderNumber = parseInt(newReorderLevel);
  if (isNaN(reorderNumber) || reorderNumber < 0) {
    alert('Please enter a valid reorder level (0 or greater)');
    return;
  }
  
  updateReorderLevel(productId, reorderNumber);
}

// Update stock level via API
async function updateStockLevel(productId, newStock, reason) {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/adjust/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_stock: newStock,
        reason: reason
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update stock level');
    }
    
    const result = await response.json();
    alert(`Stock updated successfully!\nPrevious: ${result.data.previousStock} → New: ${result.data.newStock}`);
    
    // Refresh stock levels
    loadStockLevels();
    
  } catch (error) {
    console.error('Error updating stock level:', error);
    alert('Failed to update stock level: ' + error.message);
  }
}

// Update reorder level via API
async function updateReorderLevel(productId, newReorderLevel) {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/reorder-level/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reorder_level: newReorderLevel
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update reorder level');
    }
    
    alert('Reorder level updated successfully!');
    
    // Refresh stock levels
    loadStockLevels();
    
  } catch (error) {
    console.error('Error updating reorder level:', error);
    alert('Failed to update reorder level: ' + error.message);
  }
}

// Show stock intake form
async function showStockIntakeForm() {
  try {
    hideAllStockDisplays();
    
    // Load products for selection
    await loadProducts();
    const stockProductSelect = document.getElementById('stockProductSelect');
    stockProductSelect.innerHTML = '<option value="">Select Product</option>';
    
    productList.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.name;
      stockProductSelect.appendChild(option);
    });
    
    // Clear form
    clearStockIntakeForm();
    
    document.getElementById('stockIntakeForm').style.display = 'block';
    
  } catch (error) {
    console.error('Error showing stock intake form:', error);
    alert('Failed to load stock intake form: ' + error.message);
  }
}

// Clear stock intake form
function clearStockIntakeForm() {
  document.getElementById('stockProductSelect').value = '';
  document.getElementById('stockQuantity').value = '';
  document.getElementById('stockCostPerUnit').value = '';
  document.getElementById('stockSupplier').value = '';
  document.getElementById('stockBatchNumber').value = '';
  document.getElementById('stockExpiryDate').value = '';
  document.getElementById('stockNotes').value = '';
}

// Submit stock intake
async function submitStockIntake() {
  try {
    const productId = document.getElementById('stockProductSelect').value;
    const quantity = document.getElementById('stockQuantity').value;
    const costPerUnit = document.getElementById('stockCostPerUnit').value;
    const supplier = document.getElementById('stockSupplier').value;
    const batchNumber = document.getElementById('stockBatchNumber').value;
    const expiryDate = document.getElementById('stockExpiryDate').value;
    const notes = document.getElementById('stockNotes').value;
    
    if (!productId || !quantity || quantity <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }
    
    const intakeData = {
      product_id: parseInt(productId),
      quantity_added: parseInt(quantity),
      cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : null,
      supplier: supplier || null,
      batch_number: batchNumber || null,
      expiry_date: expiryDate || null,
      notes: notes || null
    };
    
    const response = await fetch(`${API_BASE_URL}/stock/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(intakeData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to record stock intake');
    }
    
    const result = await response.json();
    alert(`Stock intake recorded successfully!\nProduct: ${result.data.product_name}\nQuantity Added: ${result.data.quantity_added}\nNew Stock Level: ${result.data.new_stock}`);
    
    // Clear form and hide it
    clearStockIntakeForm();
    document.getElementById('stockIntakeForm').style.display = 'none';
    
    // Refresh stock levels
    loadStockLevels();
    
  } catch (error) {
    console.error('Error submitting stock intake:', error);
    alert('Failed to record stock intake: ' + error.message);
  }
}

// Load and display stock alerts
async function loadStockAlerts() {
  try {
    hideAllStockDisplays();
    
    const response = await fetch(`${API_BASE_URL}/stock/alerts?acknowledged=false`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock alerts');
    }
    
    const result = await response.json();
    displayStockAlerts(result.data);
    
    document.getElementById('stockAlertsDisplay').style.display = 'block';
    
  } catch (error) {
    console.error('Error loading stock alerts:', error);
    alert('Failed to load stock alerts: ' + error.message);
  }
}

// Display stock alerts
function displayStockAlerts(alertsData) {
  const container = document.getElementById('stockAlertsDisplay');
  
  if (alertsData.length === 0) {
    container.innerHTML = `
      <h4>Stock Alerts</h4>
      <div style="padding: 20px; text-align: center; color: #28a745;">
        ✅ No active stock alerts! All stock levels are adequate.
      </div>
    `;
    return;
  }
  
  let html = `
    <h4>Stock Alerts (${alertsData.length})</h4>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Alert Level</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Current Stock</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Reorder Level</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  alertsData.forEach(alert => {
    const alertColor = getAlertLevelColor(alert.alert_level);
    const alertText = getAlertLevelText(alert.alert_level);
    
    html += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${alert.product_name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <span style="color: ${alertColor}; font-weight: bold;">${alertText}</span>
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${alert.current_stock}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${alert.reorder_level}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <button data-action="acknowledge-alert" data-alert-id="${alert.id}"
                  style="padding: 4px 8px; margin: 2px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;">
            Acknowledge
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
    <div style="margin-top: 15px;">
      <button data-action="refresh-alerts" class="btn-secondary">🔄 Refresh</button>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add event delegation for alerts buttons
  container.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'acknowledge-alert') {
      const alertId = e.target.dataset.alertId;
      acknowledgeAlert(alertId);
    } else if (action === 'refresh-alerts') {
      loadStockAlerts();
    }
  });
}

// Get alert level color
function getAlertLevelColor(alertLevel) {
  switch(alertLevel) {
    case 'OUT_OF_STOCK': return '#dc3545';
    case 'CRITICAL': return '#fd7e14';
    case 'LOW': return '#ffc107';
    default: return '#6c757d';
  }
}

// Get alert level text
function getAlertLevelText(alertLevel) {
  switch(alertLevel) {
    case 'OUT_OF_STOCK': return '🔴 Out of Stock';
    case 'CRITICAL': return '🟠 Critical';
    case 'LOW': return '🟡 Low Stock';
    default: return '❓ Unknown';
  }
}

// Acknowledge stock alert
async function acknowledgeAlert(alertId) {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        acknowledged_by: 'admin'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to acknowledge alert');
    }
    
    alert('Alert acknowledged successfully!');
    
    // Refresh alerts
    loadStockAlerts();
    
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    alert('Failed to acknowledge alert: ' + error.message);
  }
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
    yPos += 6; // Reduced from 8 to 6
    if (orderData.email) {
      doc.text(`Email: ${orderData.email}`, 25, yPos);
      yPos += 6; // Reduced from 8 to 6
    }
    doc.text(`Phone: ${orderData.phone}`, 25, yPos);
    yPos += 6; // Reduced from 8 to 6
    doc.text(`Address: ${orderData.address || 'Not provided'}`, 25, yPos);
    yPos += 6; // Reduced from 8 to 6
    if (orderData.company) {
      doc.text(`Company: ${orderData.company}`, 25, yPos);
      yPos += 6; // Reduced from 8 to 6
    }
    
    // Order details
    yPos += 5;
    doc.text('ORDER DETAILS:', 20, yPos);
    yPos += 10;
    doc.text(`Order Date: ${new Date(orderData.created_at).toLocaleDateString()}`, 25, yPos);
    yPos += 6; // Reduced from 8 to 6
    if (orderData.delivery_date) {
      doc.text(`Delivery Date: ${new Date(orderData.delivery_date).toLocaleDateString()}`, 25, yPos);
      yPos += 6; // Reduced from 8 to 6
    }
    if (orderData.preferred_delivery_method) {
      const deliveryMethodNames = {
        'pickup': 'Pickup from Store',
        'delivery': 'Home/Office Delivery',
        'shipping': 'Courier Shipping'
      };
      doc.text(`Delivery Method: ${deliveryMethodNames[orderData.preferred_delivery_method] || orderData.preferred_delivery_method}`, 25, yPos);
      yPos += 6; // Reduced from 8 to 6
    }
    if (orderData.delivery_route) {
      doc.text(`Delivery Instructions: ${orderData.delivery_route}`, 25, yPos);
      yPos += 6; // Reduced from 8 to 6
    }
    if (orderData.request_status) {
      const urgencyNames = {
        'can_wait_24hrs': 'Can wait for 24 hours',
        'urgent': 'Urgent',
        'very_urgent': 'Very Urgent'
      };
      doc.text(`Urgency: ${urgencyNames[orderData.request_status] || orderData.request_status}`, 25, yPos);
      yPos += 6; // Reduced from 8 to 6
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
        yPos += 6; // Reduced from 8 to 6
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
    yPos += 6; // Reduced from 8 to 6
    doc.text('VAT (2.5%):', 140, yPos);
    doc.text(`₦${vat.toFixed(2)}`, 170, yPos);
    yPos += 6; // Reduced from 8 to 6
    doc.setFontSize(14);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`₦${total.toFixed(2)}`, 170, yPos);
    
    // Amount in words
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const amountInWords = nairaConverter.convertAmountToWords(total);
    doc.text(`Amount in Words: ${amountInWords}`, 20, yPos);
    
    // Payment instructions
    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('PAYMENT INFORMATION:', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.text('Please make payment to any of these accounts:', 25, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.text('Account Name: BONNESANTE MEDICALS', 25, yPos);
    yPos += 5;
    doc.text('Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK', 25, yPos);
    yPos += 5;
    doc.text('Account 2: 1379643548 - ACCESS BANK', 25, yPos);
    
    // Footer
    yPos += 10; // Reduced from 15 to 10
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing ASTRO-BSM Professional Medical Supplies!', 20, yPos);
    yPos += 5; // Reduced from 6 to 5
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
    console.log('Generating invoice for order ID:', orderId);
    
    // Fetch complete order details with items directly from API
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    
    const orderWithItems = await response.json();
    console.log('Fetched order for invoice:', orderWithItems);
    
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
  
  console.log('Generating invoice with order data:', order);
  
  // Load and add company logo
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    try {
      // Add logo to PDF (top left corner)
      pdf.addImage(img, 'PNG', 15, 15, 25, 25);
      
      // Generate the rest of the invoice after logo is loaded
      generateInvoiceContent(pdf, order);
      
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
      // Generate invoice without logo if there's an error
      generateInvoiceContent(pdf, order);
    }
  };
  
  img.onerror = function() {
    console.log('Logo could not be loaded, generating invoice without logo');
    generateInvoiceContent(pdf, order);
  };
  
  // Try to load the logo
  img.src = '/public/company_logo.PNG';
}

// Generate Invoice Content Function
function generateInvoiceContent(pdf, order) {
  // Company Header (positioned to accommodate logo)
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASTRO-BSM', 50, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Business Solutions & Management', 50, 33);
  pdf.text('Professional Order Management System', 50, 41);
  
  // Invoice Details
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', 20, 70);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
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
  
  console.log('Order items:', order.items);
  
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item, index) => {
      console.log(`Item ${index}:`, item);
      
      // Check if we need a new page (leave space for totals and payment info)
      if (yPos > 240) {
        pdf.addPage();
        yPos = 20;
        
        // Re-add table header on new page
        pdf.setFont(undefined, 'bold');
        pdf.text('Item', 20, yPos);
        pdf.text('Qty', 100, yPos);
        pdf.text('Price', 130, yPos);
        pdf.text('Total', 160, yPos);
        pdf.line(20, yPos + 5, 190, yPos + 5);
        yPos += 15;
        pdf.setFont(undefined, 'normal');
      }
      
      // Try different possible property names for item data
      const itemName = item.name || item.product_name || item.item_name || 'Unknown Item';
      const itemPrice = parseFloat(item.price || item.product_price || item.unit_price || 0);
      const itemQty = parseInt(item.quantity || item.qty || 1);
      const lineTotal = itemPrice * itemQty;
      itemTotal += lineTotal;
      
      // Use proper Naira symbol (Unicode: \u20A6)
      pdf.text(itemName, 20, yPos);
      pdf.text(`${itemQty}`, 100, yPos);
      pdf.text(`\u20A6${itemPrice.toFixed(2)}`, 130, yPos);
      pdf.text(`\u20A6${lineTotal.toFixed(2)}`, 160, yPos);
      yPos += 7; // Reduced from 10 to 7 for tighter spacing
    });
  } else {
    console.log('No items found or items is not an array');
    pdf.text('No items found', 20, yPos);
  }
  
  // Totals Section
  yPos += 8; // Reduced from 10 to 8
  
  // Check if we need a new page for totals and payment info
  if (yPos > 230) {
    pdf.addPage();
    yPos = 20;
  }
  
  pdf.line(130, yPos, 190, yPos); // Line above totals
  yPos += 8; // Reduced from 10 to 8
  
  const subtotal = parseFloat(order.subtotal) || itemTotal;
  const vat = parseFloat(order.vat) || (subtotal * 0.075);
  const total = parseFloat(order.total) || (subtotal + vat);
  
  pdf.text('Subtotal:', 130, yPos);
  pdf.text(`\u20A6${subtotal.toFixed(2)}`, 160, yPos);
  yPos += 8; // Reduced from 10 to 8
  
  pdf.text('VAT (7.5%):', 130, yPos);
  pdf.text(`\u20A6${vat.toFixed(2)}`, 160, yPos);
  yPos += 8; // Reduced from 10 to 8
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total:', 130, yPos);
  pdf.text(`\u20A6${total.toFixed(2)}`, 160, yPos);
  
  // Amount in words
  yPos += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const amountInWords = nairaConverter.convertAmountToWords(total);
  pdf.text(`Amount in Words: ${amountInWords}`, 20, yPos);
  
  // Payment Information
  yPos += 15;
  
  // Check if payment section needs new page
  if (yPos > 250) {
    pdf.addPage();
    yPos = 20;
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Payment Information:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  yPos += 8;
  pdf.text('Account Name: BONNESANTE MEDICALS', 20, yPos);
  yPos += 7;
  pdf.text('Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK', 20, yPos);
  yPos += 7;
  pdf.text('Account 2: 1379643548 - ACCESS BANK', 20, yPos);
  
  // Footer
  yPos += 12; // Reduced from 20 to 12
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Thank you for your business!', 105, yPos, null, null, 'center');
  yPos += 7; // Reduced from 10 to 7
  pdf.text('For inquiries, contact us at info@astro-bsm.com', 105, yPos, null, null, 'center');
  
  // Save PDF with customer name
  const customerName = (order.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Invoice_${customerName}_${order.id || 'N/A'}.pdf`;
  pdf.save(fileName);
  
  // Mark notification as invoice generated
  markInvoiceGenerated(order.id);
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
    
    if (e.target.matches('.btn-thermal-print-order')) {
      const orderId = e.target.getAttribute('data-order-id');
      thermalPrintOrderById(parseInt(orderId));
    }
    
    if (e.target.matches('.btn-thermal-print-invoice')) {
      const orderId = e.target.getAttribute('data-order-id');
      thermalPrintInvoiceById(parseInt(orderId));
    }
    
    if (e.target.matches('.btn-payment-receipt')) {
      const orderId = e.target.getAttribute('data-order-id');
      showPaymentReceiptModal(parseInt(orderId));
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

// Notification System Functions
function initializeNotificationSystem() {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }

  // Load notifications from localStorage
  loadNotifications();
  
  // Setup event listeners
  if (notificationBtn) {
    notificationBtn.addEventListener('click', toggleNotificationCenter);
  }
  
  if (closeNotifications) {
    closeNotifications.addEventListener('click', closeNotificationCenter);
  }
  
  // Remove old unlock notifications button - no longer needed with role-based access
  
  if (clearAllNotifications) {
    clearAllNotifications.addEventListener('click', clearAllNotificationHistory);
  }
  
  if (markAllRead) {
    markAllRead.addEventListener('click', markAllNotificationsRead);
  }
  
  // Add event delegation for notification action buttons
  if (notificationsList) {
    notificationsList.addEventListener('click', handleNotificationAction);
  }

  // Start checking for pending orders
  startNotificationPolling();
}

function createNotification(orderId, customerName, orderTotal) {
  const notification = {
    id: Date.now(),
    orderId: orderId,
    customerName: customerName,
    orderTotal: orderTotal,
    timestamp: new Date().toISOString(),
    read: false,
    invoiceGenerated: false
  };
  
  notifications.unshift(notification);
  saveNotifications();
  updateNotificationBadge();
  
  // Show browser notification using Service Worker only
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('New Order Received!', {
        body: `Order from ${customerName} - Total: ₦${orderTotal}`,
        icon: '/public/company_logo.PNG',
        tag: `order-${orderId}`,
        requireInteraction: true,
        badge: '/public/company_logo.PNG'
      });
    }).catch(error => {
      console.log('Service Worker notification failed:', error);
      // Don't fall back to direct Notification constructor - it violates CSP
    });
  } else {
    console.log('Service Worker or Notification API not available');
  }
  
  // Show notification button
  if (notificationBtn) {
    notificationBtn.style.display = 'block';
  }
}

function markInvoiceGenerated(orderId) {
  const notification = notifications.find(n => n.orderId === orderId);
  if (notification) {
    notification.invoiceGenerated = true;
    saveNotifications();
    updateNotificationBadge();
  }
}

function loadNotifications() {
  const saved = localStorage.getItem('astrobsm_notifications');
  if (saved) {
    notifications = JSON.parse(saved);
    updateNotificationBadge();
    
    // Show notification button if there are notifications
    if (notifications.length > 0 && notificationBtn) {
      notificationBtn.style.display = 'block';
    }
  }
}

function saveNotifications() {
  localStorage.setItem('astrobsm_notifications', JSON.stringify(notifications));
}

function updateNotificationBadge() {
  const unreadCount = notifications.filter(n => !n.read && !n.invoiceGenerated).length;
  if (notificationBadge) {
    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
  }
}

function toggleNotificationCenter() {
  if (notificationCenter) {
    const isVisible = notificationCenter.style.display !== 'none';
    if (isVisible) {
      notificationCenter.style.display = 'none';
    } else {
      // Check role-based access for notifications
      if (authManager.canAccess('notifications')) {
        notificationCenter.style.display = 'block';
        renderNotifications();
      } else {
        alert('Access denied. Please log in with appropriate permissions.');
      }
    }
  }
}

function closeNotificationCenter() {
  if (notificationCenter) {
    notificationCenter.style.display = 'none';
  }
}

// Removed unlockNotificationCenter - notifications now use role-based access

function renderNotifications() {
  if (!notificationsContent) return;
  
  if (notifications.length === 0) {
    notificationsContent.innerHTML = '<div class="notification-item">No notifications</div>';
    return;
  }
  
  const html = notifications.map(notification => {
    if (notification.type === 'stock_alert') {
      return renderStockAlertNotification(notification);
    } else {
      return renderOrderNotification(notification);
    }
  }).join('');
  
  notificationsContent.innerHTML = html;
}

function renderOrderNotification(notification) {
  const isUnread = !notification.read && !notification.invoiceGenerated;
  const statusText = notification.invoiceGenerated ? '✅ Invoice Generated' : '⏳ Pending Invoice';
  const statusColor = notification.invoiceGenerated ? '#10b981' : '#f59e0b';
  
  return `
    <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
      <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
      <div class="notification-title">📦 New Order #${notification.orderId}</div>
      <div class="notification-content">
        <strong>Customer:</strong> ${notification.customerName}<br>
        <strong>Total:</strong> ₦${notification.orderTotal}<br>
        <strong>Status:</strong> <span style="color: ${statusColor}">${statusText}</span>
      </div>
      <div class="notification-actions">
        ${!notification.invoiceGenerated ? `<button class="btn-notification-action btn-generate-invoice" data-order-id="${notification.orderId}">Generate Invoice</button>` : ''}
        <button class="btn-notification-action btn-payment-receipt" data-order-id="${notification.orderId}">Payment Receipt</button>
        <button class="btn-notification-action btn-mark-read" data-notification-id="${notification.id}">Mark Read</button>
      </div>
    </div>
  `;
}

function renderStockAlertNotification(notification) {
  const isUnread = !notification.read && !notification.acknowledged;
  const alertIcon = getStockAlertIcon(notification.alertLevel);
  const alertColor = getAlertLevelColor(notification.alertLevel);
  const alertText = getAlertLevelText(notification.alertLevel);
  
  return `
    <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}" style="border-left: 4px solid ${alertColor};">
      <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
      <div class="notification-title">${alertIcon} Stock Alert: ${notification.productName}</div>
      <div class="notification-content">
        <strong>Alert Level:</strong> <span style="color: ${alertColor}; font-weight: bold;">${alertText}</span><br>
        <strong>Current Stock:</strong> ${notification.currentStock} units<br>
        <strong>Reorder Level:</strong> ${notification.reorderLevel} units
      </div>
      <div class="notification-actions">
        ${!notification.acknowledged ? `<button class="btn-notification-action btn-acknowledge-alert" data-product-id="${notification.productId}" data-notification-id="${notification.id}" style="background-color: #28a745;">Acknowledge</button>` : ''}
        <button class="btn-notification-action btn-view-stock" data-product-id="${notification.productId}">View Stock</button>
        <button class="btn-notification-action btn-mark-read" data-notification-id="${notification.id}">Mark Read</button>
      </div>
    </div>
  `;
}

function getStockAlertIcon(alertLevel) {
  switch(alertLevel) {
    case 'OUT_OF_STOCK': return '🔴';
    case 'CRITICAL': return '🟠';
    case 'LOW': return '🟡';
    default: return '⚠️';
  }
}

function generateInvoiceFromNotification(orderId) {
  generateInvoiceForOrder(orderId);
  markInvoiceGenerated(orderId);
  renderNotifications();
}

function markNotificationRead(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
  }
}

function markAllNotificationsRead() {
  notifications.forEach(n => n.read = true);
  saveNotifications();
  updateNotificationBadge();
  renderNotifications();
}

function clearAllNotificationHistory() {
  if (confirm('Are you sure you want to clear all notifications?')) {
    notifications = [];
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
    notificationBtn.style.display = 'none';
  }
}

function handleNotificationAction(event) {
  // Handle Generate Invoice button
  if (event.target.classList.contains('btn-generate-invoice')) {
    const orderId = parseInt(event.target.getAttribute('data-order-id'));
    generateInvoiceFromNotification(orderId);
  }
  
  // Handle Mark Read button
  if (event.target.classList.contains('btn-mark-read')) {
    const notificationId = parseInt(event.target.getAttribute('data-notification-id'));
    markNotificationRead(notificationId);
  }
}

function startNotificationPolling() {
  // Check for pending notifications and stock alerts every 30 seconds
  notificationInterval = setInterval(async () => {
    const pendingNotifications = notifications.filter(n => !n.invoiceGenerated);
    
    pendingNotifications.forEach(notification => {
      // Send repeat notification for pending orders using Service Worker
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Pending Order Reminder', {
            body: `Order #${notification.orderId} from ${notification.customerName} still needs invoice generation`,
            icon: '/public/company_logo.PNG',
            tag: `reminder-${notification.orderId}`,
            requireInteraction: false,
            badge: '/public/company_logo.PNG'
          });
        }).catch(error => {
          console.log('Service Worker notification failed for reminder, skipping');
        });
      }
    });
    
    // Check for stock alerts
    await checkAndNotifyStockAlerts();
  }, 30000); // 30 seconds
}

// Function to check for stock alerts and create notifications
async function checkAndNotifyStockAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/stock/alerts?acknowledged=false`);
    if (!response.ok) return;
    
    const result = await response.json();
    const stockAlerts = result.data || [];
    
    stockAlerts.forEach(alert => {
      // Check if we already have a notification for this alert
      const existingNotification = notifications.find(n => n.type === 'stock_alert' && n.productId === alert.product_id);
      
      if (!existingNotification) {
        createStockAlertNotification(alert);
      }
    });
    
  } catch (error) {
    console.error('Error checking stock alerts:', error);
  }
}

// Function to create stock alert notifications
function createStockAlertNotification(alert) {
  const notification = {
    id: Date.now(),
    type: 'stock_alert',
    productId: alert.product_id,
    productName: alert.product_name,
    alertLevel: alert.alert_level,
    currentStock: alert.current_stock,
    reorderLevel: alert.reorder_level,
    timestamp: new Date().toISOString(),
    read: false,
    acknowledged: false
  };
  
  notifications.unshift(notification);
  saveNotifications();
  updateNotificationBadge();
  
  // Show browser notification
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    const alertText = getStockAlertNotificationText(alert.alert_level);
    const urgencyLevel = alert.alert_level === 'OUT_OF_STOCK' ? true : false;
    
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(`${alertText} Stock Alert!`, {
        body: `${alert.product_name}: ${alert.current_stock} units remaining (Reorder at: ${alert.reorder_level})`,
        icon: '/public/company_logo.PNG',
        tag: `stock-alert-${alert.product_id}`,
        requireInteraction: urgencyLevel,
        badge: '/public/company_logo.PNG',
        urgency: urgencyLevel ? 'high' : 'normal'
      });
    }).catch(error => {
      console.log('Service Worker not available for stock alert notification');
    });
  }
}

// Get stock alert notification text based on level
function getStockAlertNotificationText(alertLevel) {
  switch(alertLevel) {
    case 'OUT_OF_STOCK': return '🔴 URGENT';
    case 'CRITICAL': return '🟠 CRITICAL';
    case 'LOW': return '🟡 LOW';
    default: return '⚠️';
  }
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

// PWA Install Functionality
let deferredPrompt;
let installButton;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA: beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button if it exists
  showInstallButton();
});

// Show install button
function showInstallButton() {
  installButton = document.getElementById('install-btn');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', installPWA);
  } else {
    // Create install button dynamically if not found
    createInstallButton();
  }
}

// Create install button
function createInstallButton() {
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && deferredPrompt) {
    installButton = document.createElement('button');
    installButton.id = 'install-btn';
    installButton.innerHTML = '📱 Install App';
    installButton.className = 'install-button';
    installButton.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 10px;
    `;
    installButton.addEventListener('click', installPWA);
    headerActions.appendChild(installButton);
  }
}

// Install PWA
async function installPWA() {
  if (!deferredPrompt) return;
  
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    deferredPrompt = null;
    if (installButton) {
      installButton.style.display = 'none';
    }
  } catch (error) {
    console.error('PWA install error:', error);
  }
}

// Check if app is already installed
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
  if (installButton) {
    installButton.style.display = 'none';
  }
});

// iOS Safari specific install instructions
function showIOSInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
  
  if (isIOS && !isInStandaloneMode && !localStorage.getItem('iosInstallDismissed')) {
    const iosInstallBanner = document.createElement('div');
    iosInstallBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #007bff;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 1000;
      font-size: 14px;
    `;
    iosInstallBanner.innerHTML = `
      📱 To install this app on iOS: Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
      <button data-action="dismiss-ios-install"
              style="float: right; background: none; border: none; color: white; font-size: 18px;">✕</button>
    `;
    document.body.prepend(iosInstallBanner);
    
    // Add event listener for dismiss button
    iosInstallBanner.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'dismiss-ios-install') {
        iosInstallBanner.remove();
        localStorage.setItem('iosInstallDismissed', 'true');
      }
    });
  }
}

// ===== USER MANAGEMENT FUNCTIONS =====

let currentUsers = [];

function showUserManagement() {
  console.log('🔧 Showing user management...');
  
  const ordersSection = document.getElementById('ordersSection');
  const productsSection = document.getElementById('productsSection');
  const stockSection = document.getElementById('stockSection');
  const userManagementSection = document.getElementById('userManagementSection');
  
  if (ordersSection) ordersSection.style.display = 'none';
  if (productsSection) productsSection.style.display = 'none';
  if (stockSection) stockSection.style.display = 'none';
  if (userManagementSection) {
    userManagementSection.style.display = 'block';
    loadUsers();
    setupUserManagementEventListeners();
  }
}

function hideUserManagement() {
  console.log('🔧 Hiding user management...');
  
  const userManagementSection = document.getElementById('userManagementSection');
  const ordersSection = document.getElementById('ordersSection');
  
  if (userManagementSection) userManagementSection.style.display = 'none';
  if (ordersSection) ordersSection.style.display = 'block';
}

async function loadUsers() {
  try {
    console.log('📊 Loading users...');
    
    // Get current user authentication info
    const currentRole = authManager.getCurrentRole();
    if (!currentRole) {
      throw new Error('No user role found. Please login again.');
    }
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUsers = data.roles || [];
      renderUsers();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    alert('Error loading users: ' + error.message);
  }
}

function renderUsers() {
  const usersList = document.getElementById('usersList');
  if (!usersList) return;
  
  console.log('🎯 Rendering users:', currentUsers);
  
  if (currentUsers.length === 0) {
    usersList.innerHTML = '<div class="no-data">No users found</div>';
    return;
  }
  
  const html = currentUsers.map(user => {
    console.log('👤 Processing user:', user);
    
    // Handle permissions - they might be stored as JSON string
    let permissions = user.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        console.warn('Failed to parse permissions for user:', user.role_name, e);
        permissions = [];
      }
    }
    
    return `
    <div class="user-item" data-user-id="${user.id}">
      <h4>
        ${user.role_display_name}
        <span class="user-role-badge">${user.role_name}</span>
      </h4>
      <p>${user.description || 'No description provided'}</p>
      <div class="user-permissions">
        ${permissions.map(perm => `<span class="permission-tag">${perm}</span>`).join('')}
      </div>
      <div class="user-actions">
        <button class="btn-edit-user" data-user-id="${user.id}">✏️ Edit</button>
        ${!['customer', 'sales_staff', 'superadmin'].includes(user.role_name) ? 
          `<button class="btn-delete-user" data-user-id="${user.id}">🗑️ Delete</button>` : ''}
        ${user.requires_password ? 
          `<button class="btn-change-password" data-user-id="${user.id}">🔑 Change Password</button>` : ''}
      </div>
    </div>`;
  }).join('');
  
  usersList.innerHTML = html;
}

function setupUserManagementEventListeners() {
  // Add User button
  const addUserBtn = document.getElementById('addUserBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const backToOrdersFromUsers = document.getElementById('backToOrdersFromUsers');
  
  if (addUserBtn && !addUserBtn.hasEventListener) {
    addUserBtn.addEventListener('click', showAddUserForm);
    addUserBtn.hasEventListener = true;
  }
  
  if (changePasswordBtn && !changePasswordBtn.hasEventListener) {
    changePasswordBtn.addEventListener('click', showChangePasswordForm);
    changePasswordBtn.hasEventListener = true;
  }
  
  if (backToOrdersFromUsers && !backToOrdersFromUsers.hasEventListener) {
    backToOrdersFromUsers.addEventListener('click', hideUserManagement);
    backToOrdersFromUsers.hasEventListener = true;
  }
  
  // Form submission handlers
  const saveUserBtn = document.getElementById('saveUserBtn');
  const cancelUserBtn = document.getElementById('cancelUserBtn');
  const savePasswordChanges = document.getElementById('savePasswordChanges');
  const cancelPasswordChanges = document.getElementById('cancelPasswordChanges');
  
  if (saveUserBtn && !saveUserBtn.hasEventListener) {
    saveUserBtn.addEventListener('click', handleSaveUser);
    saveUserBtn.hasEventListener = true;
  }
  
  if (cancelUserBtn && !cancelUserBtn.hasEventListener) {
    cancelUserBtn.addEventListener('click', hideAddUserForm);
    cancelUserBtn.hasEventListener = true;
  }
  
  if (savePasswordChanges && !savePasswordChanges.hasEventListener) {
    savePasswordChanges.addEventListener('click', handleSavePasswordChanges);
    savePasswordChanges.hasEventListener = true;
  }
  
  if (cancelPasswordChanges && !cancelPasswordChanges.hasEventListener) {
    cancelPasswordChanges.addEventListener('click', hideChangePasswordForm);
    cancelPasswordChanges.hasEventListener = true;
  }
  
  // Dynamic event delegation for user action buttons
  const usersList = document.getElementById('usersList');
  if (usersList && !usersList.hasEventListener) {
    usersList.addEventListener('click', handleUserAction);
    usersList.hasEventListener = true;
  }
}

function showAddUserForm() {
  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
    addUserForm.style.display = 'block';
    
    // Clear form
    document.getElementById('newUserRole').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserDescription').value = '';
    
    // Clear all checkboxes
    const checkboxes = addUserForm.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
  }
}

function hideAddUserForm() {
  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) addUserForm.style.display = 'none';
}

function showChangePasswordForm() {
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordChangeList = document.getElementById('passwordChangeList');
  
  if (!changePasswordForm || !passwordChangeList) return;
  
  // Get users that require passwords
  const usersWithPasswords = currentUsers.filter(user => user.requires_password);
  
  const html = usersWithPasswords.map(user => `
    <div class="password-change-item">
      <label for="password_${user.id}">${user.role_display_name} (${user.role_name})</label>
      <input type="password" id="password_${user.id}" data-user-id="${user.id}" 
             placeholder="Enter new password for ${user.role_display_name}">
    </div>
  `).join('');
  
  passwordChangeList.innerHTML = html;
  changePasswordForm.style.display = 'block';
}

function hideChangePasswordForm() {
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) changePasswordForm.style.display = 'none';
}

async function handleSaveUser() {
  try {
    const roleName = document.getElementById('newUserRole').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const description = document.getElementById('newUserDescription').value.trim();
    
    if (!roleName) {
      alert('Please enter a role name.');
      return;
    }
    
    // Get selected permissions
    const checkboxes = document.querySelectorAll('#addUserForm input[type="checkbox"]:checked');
    const permissions = Array.from(checkboxes).map(cb => cb.value);
    
    if (permissions.length === 0) {
      alert('Please select at least one permission.');
      return;
    }
    
    const requiresPassword = permissions.some(p => !['place_orders', 'view_products', 'view_order_status'].includes(p));
    
    if (requiresPassword && !password) {
      alert('Password is required for roles with elevated permissions.');
      return;
    }
    
    // Get current user authentication info
    const currentRole = authManager.getCurrentRole();
    if (!currentRole) {
      throw new Error('No user role found. Please login again.');
    }
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role_name: roleName.toLowerCase().replace(/\s+/g, '_'),
        role_display_name: roleName,
        description: description,
        permissions: permissions,
        password: requiresPassword ? password : null,
        requires_password: requiresPassword,
        userRole: currentRole
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('User role created successfully!');
      hideAddUserForm();
      loadUsers();
    } else {
      alert('Error creating user: ' + result.error);
    }
  } catch (error) {
    console.error('Error saving user:', error);
    alert('Error saving user: ' + error.message);
  }
}

async function handleSavePasswordChanges() {
  try {
    const passwordInputs = document.querySelectorAll('#passwordChangeList input[type="password"]');
    const changes = [];
    
    passwordInputs.forEach(input => {
      if (input.value.trim()) {
        changes.push({
          userId: input.dataset.userId,
          password: input.value.trim()
        });
      }
    });
    
    if (changes.length === 0) {
      alert('No password changes to save.');
      return;
    }
    
    // Get current user authentication info
    const currentRole = authManager.getCurrentRole();
    if (!currentRole) {
      throw new Error('No user role found. Please login again.');
    }
    
    for (const change of changes) {
      const response = await fetch(`${API_BASE_URL}/users/${change.userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: change.password,
          userRole: currentRole
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to change password: ${error.error}`);
      }
    }
    
    alert('Passwords updated successfully!');
    hideChangePasswordForm();
    
  } catch (error) {
    console.error('Error changing passwords:', error);
    alert('Error changing passwords: ' + error.message);
  }
}

function handleUserAction(event) {
  const target = event.target;
  const userId = target.dataset.userId;
  
  if (target.classList.contains('btn-delete-user')) {
    handleDeleteUser(userId);
  } else if (target.classList.contains('btn-change-password')) {
    // Show individual password change for this user
    showChangePasswordForm();
  }
}

async function handleDeleteUser(userId) {
  const user = currentUsers.find(u => u.id == userId);
  if (!user) return;
  
  if (!confirm(`Are you sure you want to delete the role "${user.role_display_name}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    // Get current user authentication info
    const currentRole = authManager.getCurrentRole();
    if (!currentRole) {
      throw new Error('No user role found. Please login again.');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userRole: currentRole
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('User role deleted successfully!');
      loadUsers();
    } else {
      alert('Error deleting user: ' + result.error);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user: ' + error.message);
    
    setTimeout(() => {
      if (iosInstallBanner.parentElement) {
        iosInstallBanner.remove();
        localStorage.setItem('iosInstallDismissed', 'true');
      }
    }, 10000);
  }
}

// Initialize iOS install instructions
document.addEventListener('DOMContentLoaded', showIOSInstallInstructions);
