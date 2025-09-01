console.log('🚀 App.js script loaded successfully!');

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
const manageProductsBtn = document.getElementById('manageProductsBtn');
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

// Load products from API
async function loadProducts() {
  try {
    console.log('Loading products from API...');
    const response = await fetch(`${API_BASE_URL}/products`);
    if (response.ok) {
      const productsFromAPI = await response.json();
      console.log('Raw API response:', productsFromAPI);
      console.log('API response length:', productsFromAPI.length);
      
      // Convert API response to product objects if needed
      productList = productsFromAPI.map(product => {
        if (typeof product === 'string') {
          // If it's just a string, we need to find the price
          return { name: product, price: 0 }; // Fallback price
        } else {
          // If it's already an object with name and price
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price) || 0
          };
        }
      });
      
      console.log('Processed productList:', productList);
      console.log('ProductList length:', productList.length);
    } else {
      // Fallback to comprehensive product list with prices
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
    }
  } catch (error) {
    console.error('Error loading products:', error);
    // Use comprehensive fallback list with prices
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
  }
}

// Create item row with improved styling
function createItemRow() {
  itemCount++;
  const div = document.createElement('div');
  div.className = 'item-row fade-in';
  
  console.log('Creating item row, productList:', productList);
  console.log('ProductList is array:', Array.isArray(productList));
  console.log('ProductList length:', productList ? productList.length : 'undefined');
  
  const productOptions = Array.isArray(productList) && productList.length > 0 
    ? productList.map(item => {
        if (typeof item === 'object' && item.name && item.price !== undefined) {
          // Format price with thousands separator
          const formattedPrice = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(item.price);
          
          return `<option value="${item.name}">${item.name} - ${formattedPrice}</option>`;
        } else {
          const itemName = typeof item === 'object' ? item.name : item;
          return `<option value="${itemName}">${itemName}</option>`;
        }
      }).join('')
    : '<option value="">No products available</option>';

  console.log('Generated product options:', productOptions);

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
      <button type="button" class="btn-danger removeItemBtn">Remove</button>
    </div>
  `;
  
  itemsContainer.appendChild(div);
  
  // Add remove functionality
  div.querySelector('.removeItemBtn').addEventListener('click', () => {
    div.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => div.remove(), 300);
  });
  
  // Add change listener for price calculation
  const selectElement = div.querySelector(`select[name="item${itemCount}"]`);
  const quantityElement = div.querySelector(`input[name="quantity${itemCount}"]`);
  
  const updateCalculation = () => {
    calculateOrderTotal();
  };
  
  selectElement.addEventListener('change', updateCalculation);
  quantityElement.addEventListener('input', updateCalculation);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
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
    console.log('DOM loaded, starting initialization...');
    
    // Load products first
    await loadProducts();
    console.log('Products loaded, productList:', productList);
    
    // Create initial item row after products are loaded
    createItemRow();
    console.log('Initial item row created');
    
    // Add change listeners
    addItemChangeListeners();
    
    // Set up Add Item button
    if (addItemBtn) {
      addItemBtn.addEventListener('click', createItemRow);
    }
    
    // Set up admin functionality
    if (adminBtn) {
      adminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (adminModal) {
          adminModal.style.display = 'block';
        }
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
        if (password === 'roseball') {
          passwordSection.style.display = 'none';
          ordersSection.style.display = 'block';
          await loadAllOrders();
        } else {
          alert('Incorrect password');
          adminPassword.value = '';
        }
      });
    }

    if (manageProductsBtn) {
      manageProductsBtn.addEventListener('click', () => {
        if (productModal) {
          productModal.style.display = 'block';
          loadProductsForManagement();
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
    
    // PWA Installation Prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button or notification
      console.log('PWA install prompt available');
      
      // You can add a custom install button here
      const installButton = document.createElement('button');
      installButton.textContent = '📱 Install App';
      installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
      `;
      
      installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          deferredPrompt = null;
          installButton.remove();
        });
      });
      
      document.body.appendChild(installButton);
    });
    
    // Product Management Event Listeners
    const addProductBtn = document.getElementById('addProductBtn');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const addProductForm = document.getElementById('addProductForm');
    
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => {
        if (addProductForm) {
          addProductForm.style.display = addProductForm.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
    
    if (saveProductBtn) {
      saveProductBtn.addEventListener('click', async () => {
        const nameElement = document.getElementById('newProductName');
        const descriptionElement = document.getElementById('newProductDescription');
        const priceElement = document.getElementById('newProductPrice');
        
        if (!nameElement || !priceElement) {
          console.error('Required form elements not found');
          return;
        }
        
        const name = nameElement.value;
        const description = descriptionElement ? descriptionElement.value : '';
        const price = parseFloat(priceElement.value);
        const stockQuantity = 100; // Default stock quantity
        
        if (!name || !price || price <= 0) {
          alert('Please fill in required fields (name and valid price)');
          return;
        }
        
        try {
          const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              adminPassword: 'roseball',
              name,
              description,
              price,
              stock_quantity: stockQuantity || 0
            })
          });
          
          if (response.ok) {
            alert('Product added successfully!');
            // Clear form
            const nameElement = document.getElementById('newProductName');
            const descriptionElement = document.getElementById('newProductDescription');
            const priceElement = document.getElementById('newProductPrice');
            
            if (nameElement) nameElement.value = '';
            if (descriptionElement) descriptionElement.value = '';
            if (priceElement) priceElement.value = '';
            
            addProductForm.style.display = 'none';
            // Reload products
            await loadProductsForManagement();
            await loadProducts(); // Reload main products too
          } else {
            const error = await response.json();
            alert('Failed to add product: ' + error.error);
          }
        } catch (error) {
          console.error('Error adding product:', error);
          alert('Error adding product: ' + error.message);
        }
      });
    }
    
    if (cancelProductBtn) {
      cancelProductBtn.addEventListener('click', () => {
        // Clear form
        const nameElement = document.getElementById('newProductName');
        const descriptionElement = document.getElementById('newProductDescription');
        const priceElement = document.getElementById('newProductPrice');
        
        if (nameElement) nameElement.value = '';
        if (descriptionElement) descriptionElement.value = '';
        if (priceElement) priceElement.value = '';
        
        addProductForm.style.display = 'none';
      });
    }
    
    console.log('Application initialized successfully');
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
    
    // Submit to API with offline support
    const submissionResult = await submitOrderOfflineCapable({
      customerData,
      orderData,
      items
    });
    
    if (submissionResult.success) {
      // Show success summary
      displayOrderSummary(customerData, orderData, items, submissionResult.order || {});
      
      // Reset form
      this.reset();
      itemsContainer.innerHTML = '';
      itemCount = 0;
      createItemRow();
      
      if (submissionResult.offline) {
        // Don't show the normal success alert, notification already shown
        console.log('Order queued for offline submission');
      }
    } else {
      throw new Error(submissionResult.error || 'Failed to submit order');
    }
    
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
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦${order?.subtotal?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">VAT (2.5%):</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">₦${order?.vat_amount?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr style="background: #1e3a8a; color: white;">
              <td colspan="3" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">TOTAL AMOUNT:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold; font-size: 1.2em;">₦${order?.total_amount?.toFixed(2) || '0.00'}</td>
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
        <div class="order-card">
          <div class="order-header">
            <span class="order-id">Order #${order.id}</span>
            <span class="order-status status-${order.status}">${order.status}</span>
            <span class="urgency-badge urgency-${order.request_status}">${urgencyNames[order.request_status] || order.request_status}</span>
          </div>
          <div class="order-details">
            <div><strong>Customer:</strong> ${order.customer_name}</div>
            <div><strong>Email:</strong> ${order.email || 'Not provided'}</div>
            <div><strong>Phone:</strong> ${order.phone}</div>
            <div><strong>Total:</strong> ₦${parseFloat(order.total_amount || 0).toFixed(2)}</div>
            <div><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
            <div><strong>Delivery Date:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not specified'}</div>
            <div><strong>Delivery Method:</strong> ${deliveryMethodNames[order.preferred_delivery_method] || order.preferred_delivery_method || 'Not specified'}</div>
            ${order.delivery_route ? `<div><strong>Delivery Instructions:</strong> ${order.delivery_route}</div>` : ''}
            <div><strong>Address:</strong> ${order.delivery_address}</div>
          </div>
          <div class="order-items">
            <strong>Items:</strong>
            <ul>
              ${orderWithItems.items ? orderWithItems.items.map(item => 
                `<li>${item.product_name} - Qty: ${item.quantity} @ ₦${parseFloat(item.unit_price).toFixed(2)}</li>`
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
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const deliveryDateElement = document.getElementById('deliveryDate');
  if (deliveryDateElement) {
    deliveryDateElement.min = today;
  }
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
          <button class="btn-edit" onclick="editProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${(product.description || '').replace(/'/g, "\\'")}')">Edit</button>
          <button class="btn-delete" onclick="deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}')">Delete</button>
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

// PWA: Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // Register background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          registration.sync.register('background-order-sync');
        }
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available, show update notification
              if (confirm('New version available! Click OK to update.')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'ORDER_SYNCED') {
      console.log('Order synced from offline queue');
      showNotification(`Order ${event.data.orderId} synced successfully! (${event.data.syncedCount}/${event.data.totalQueued})`);
    }
  });
}

// Network status management
let isOnline = navigator.onLine;
let offlineOrderQueue = [];

// Initialize network status monitoring
function initNetworkStatusMonitoring() {
  updateNetworkStatus(navigator.onLine);
  
  window.addEventListener('online', () => {
    console.log('Network: Back online');
    updateNetworkStatus(true);
    syncOfflineOrders();
  });
  
  window.addEventListener('offline', () => {
    console.log('Network: Gone offline');
    updateNetworkStatus(false);
  });
}

// Update UI based on network status
function updateNetworkStatus(online) {
  isOnline = online;
  
  // Create or update network status indicator
  let statusIndicator = document.getElementById('network-status');
  if (!statusIndicator) {
    statusIndicator = document.createElement('div');
    statusIndicator.id = 'network-status';
    statusIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(statusIndicator);
  }
  
  if (online) {
    statusIndicator.textContent = '🟢 Online';
    statusIndicator.style.backgroundColor = '#d4edda';
    statusIndicator.style.color = '#155724';
    statusIndicator.style.border = '1px solid #c3e6cb';
  } else {
    statusIndicator.textContent = '🔴 Offline';
    statusIndicator.style.backgroundColor = '#f8d7da';
    statusIndicator.style.color = '#721c24';
    statusIndicator.style.border = '1px solid #f5c6cb';
  }
}

// Enhanced order submission with offline support
async function submitOrderOfflineCapable(orderData) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (result.offline) {
      // Order was queued offline
      showNotification('📱 Order saved offline and will be submitted when connection is restored', 'info');
      return { success: true, offline: true };
    } else if (result.success || response.ok) {
      // Order submitted successfully online
      showNotification('✅ Order submitted successfully!', 'success');
      return { success: true, offline: false };
    } else {
      throw new Error(result.error || 'Failed to submit order');
    }
  } catch (error) {
    console.error('Order submission error:', error);
    
    if (!isOnline) {
      // Network is offline, queue the order
      queueOfflineOrder(orderData);
      showNotification('📱 You are offline. Order saved and will be submitted when connection is restored.', 'info');
      return { success: true, offline: true };
    } else {
      // Network error while online
      showNotification('❌ Failed to submit order: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}

// Queue order for offline submission
function queueOfflineOrder(orderData) {
  const queuedOrder = {
    ...orderData,
    queuedAt: new Date().toISOString(),
    id: Date.now() + Math.random() // Simple unique ID
  };
  
  offlineOrderQueue.push(queuedOrder);
  localStorage.setItem('offlineOrderQueue', JSON.stringify(offlineOrderQueue));
  console.log('Order queued for offline submission:', queuedOrder);
  
  // Update UI
  if (window.updateOfflineQueueUI) {
    window.updateOfflineQueueUI();
  }
}

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  if (!isOnline || offlineOrderQueue.length === 0) {
    return;
  }
  
  console.log(`Syncing ${offlineOrderQueue.length} offline orders...`);
  
  const orders = [...offlineOrderQueue];
  offlineOrderQueue = [];
  
  let syncedCount = 0;
  
  for (const order of orders) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });
      
      if (response.ok) {
        syncedCount++;
        console.log('Offline order synced successfully:', order.id);
      } else {
        // Re-queue failed orders
        offlineOrderQueue.push(order);
      }
    } catch (error) {
      console.error('Failed to sync offline order:', error);
      offlineOrderQueue.push(order);
    }
  }
  
  // Update localStorage
  localStorage.setItem('offlineOrderQueue', JSON.stringify(offlineOrderQueue));
  
  if (syncedCount > 0) {
    showNotification(`✅ ${syncedCount} offline order(s) submitted successfully!`, 'success');
  }
  
  if (offlineOrderQueue.length > 0) {
    showNotification(`⚠️ ${offlineOrderQueue.length} order(s) still pending submission`, 'warning');
  }
  
  // Update UI
  if (window.updateOfflineQueueUI) {
    window.updateOfflineQueueUI();
  }
  
  // Trigger service worker sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('background-order-sync');
    });
  }
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 50px;
    right: 20px;
    max-width: 300px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  `;
  
  // Style based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#d4edda';
      notification.style.color = '#155724';
      notification.style.border = '1px solid #c3e6cb';
      break;
    case 'error':
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.border = '1px solid #f5c6cb';
      break;
    case 'warning':
      notification.style.backgroundColor = '#fff3cd';
      notification.style.color = '#856404';
      notification.style.border = '1px solid #ffeaa7';
      break;
    default:
      notification.style.backgroundColor = '#d1ecf1';
      notification.style.color = '#0c5460';
      notification.style.border = '1px solid #bee5eb';
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
  
  // Click to dismiss
  notification.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });
}

// Initialize offline functionality
document.addEventListener('DOMContentLoaded', () => {
  // Load queued orders from localStorage
  const savedQueue = localStorage.getItem('offlineOrderQueue');
  if (savedQueue) {
    offlineOrderQueue = JSON.parse(savedQueue);
    console.log(`Loaded ${offlineOrderQueue.length} orders from offline queue`);
  }
  
  // Initialize network monitoring
  initNetworkStatusMonitoring();
  
  // Initialize offline queue UI
  initOfflineQueueUI();
  
  // Try to sync offline orders on load
  if (isOnline && offlineOrderQueue.length > 0) {
    setTimeout(syncOfflineOrders, 2000); // Delay to ensure app is fully loaded
  }
});

// Initialize offline queue UI management
function initOfflineQueueUI() {
  const queueStatus = document.getElementById('offline-queue-status');
  const queueMessage = document.getElementById('queue-message');
  const retryButton = document.getElementById('queue-retry');
  
  // Update queue status display
  function updateQueueStatus() {
    if (offlineOrderQueue.length > 0) {
      queueMessage.textContent = `You have ${offlineOrderQueue.length} pending order(s) that will be submitted when online`;
      queueStatus.style.display = 'block';
      
      if (isOnline) {
        retryButton.style.display = 'inline-block';
        retryButton.textContent = 'Retry Now';
      } else {
        retryButton.style.display = 'none';
      }
    } else {
      queueStatus.style.display = 'none';
    }
  }
  
  // Retry button click handler
  retryButton.addEventListener('click', async () => {
    retryButton.textContent = 'Syncing...';
    retryButton.disabled = true;
    
    await syncOfflineOrders();
    
    retryButton.textContent = 'Retry Now';
    retryButton.disabled = false;
    updateQueueStatus();
  });
  
  // Update status on network change
  window.addEventListener('online', updateQueueStatus);
  window.addEventListener('offline', updateQueueStatus);
  
  // Initial update
  updateQueueStatus();
  
  // Update when queue changes
  window.updateOfflineQueueUI = updateQueueStatus;
}

// Add CSS animations for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .notification {
    cursor: pointer;
  }
  
  .notification:hover {
    opacity: 0.9;
  }
`;
document.head.appendChild(notificationStyle);
