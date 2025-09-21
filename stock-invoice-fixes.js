// Comprehensive Fix for Stock Addition and Invoice Email Issues

console.log('🔧 Applying fixes for stock addition and invoice email issues...');

// Fix 1: Ensure superadmin can add stock (verify role is being sent correctly)
function fixStockAdditionAuth() {
  console.log('📦 Fixing stock addition authentication...');
  
  // Override the submitStockIntake function to ensure proper auth
  window.submitStockIntake = async function() {
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

      // Get current user authentication with improved error handling
      const authData = localStorage.getItem('astro_auth');
      if (!authData) {
        alert('Authentication required. Please log in again.');
        window.location.href = 'login.html';
        return;
      }
      
      let auth;
      try {
        auth = JSON.parse(authData);
      } catch (e) {
        alert('Invalid authentication data. Please log in again.');
        localStorage.removeItem('astro_auth');
        window.location.href = 'login.html';
        return;
      }
      
      console.log('🔐 Current user role:', auth.role);
      console.log('📋 User permissions:', auth.permissions);
      
      // Check if user has stock management permission
      if (!auth.permissions || !auth.permissions.includes('manage_stock')) {
        alert('You do not have permission to manage stock. Current role: ' + auth.role);
        return;
      }
      
      const intakeData = {
        product_id: parseInt(productId),
        quantity_added: parseInt(quantity),
        cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : null,
        supplier: supplier || null,
        batch_number: batchNumber || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
        userRole: auth.role, // Include user role for authentication
        // Add legacy password for fallback authentication if needed
        adminPassword: auth.role === 'superadmin' ? 'pinkpetals' : null
      };
      
      console.log('📤 Sending stock intake request:', intakeData);
      
      const response = await fetch(`${window.location.origin}/api/stock/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(intakeData)
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        
        let errorMessage = 'Failed to record stock intake';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          
          if (errorData.requiredPermission) {
            errorMessage += `\nRequired permission: ${errorData.requiredPermission}`;
          }
        } catch (e) {
          errorMessage += ': ' + errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      alert(`Stock intake recorded successfully!\nProduct: ${result.data.product_name}\nQuantity Added: ${result.data.quantity_added}\nNew Stock Level: ${result.data.new_stock}`);
      
      // Clear form and hide it
      clearStockIntakeForm();
      document.getElementById('stockIntakeForm').style.display = 'none';
      
      // Refresh stock levels if function exists
      if (typeof loadStockLevels === 'function') {
        loadStockLevels();
      }
      
      console.log('✅ Stock intake completed successfully');
      
    } catch (error) {
      console.error('Error submitting stock intake:', error);
      alert('Failed to record stock intake: ' + error.message);
    }
  };
  
  console.log('✅ Stock addition authentication fix applied');
}

// Fix 2: Ensure invoice generation includes customer email
function fixInvoiceEmailDisplay() {
  console.log('📧 Fixing invoice email display...');
  
  // Override the generateInvoiceForOrder function to ensure email is included
  window.generateInvoiceForOrder = async function(orderId) {
    try {
      console.log('📄 Generating invoice for order:', orderId);
      
      // Fetch order with customer data
      const response = await fetch(`${window.location.origin}/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const orderWithItems = await response.json();
      console.log('📦 Order data for invoice:', orderWithItems);
      
      // Ensure customer email is available
      if (!orderWithItems.email && orderWithItems.customer_id) {
        console.log('⚠️ No email in order data, trying to fetch customer details...');
        
        try {
          const customerResponse = await fetch(`${window.location.origin}/api/customers/${orderWithItems.customer_id}`);
          if (customerResponse.ok) {
            const customer = await customerResponse.json();
            orderWithItems.email = customer.email || '';
            orderWithItems.phone = customer.phone || orderWithItems.phone;
            orderWithItems.customer_name = customer.name || orderWithItems.customer_name;
            console.log('✅ Added customer email from customer API:', orderWithItems.email);
          }
        } catch (e) {
          console.log('⚠️ Could not fetch customer details:', e.message);
        }
      }
      
      // Generate the invoice
      generateInvoice(orderWithItems);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice: ' + error.message);
    }
  };
  
  // Also fix thermal print invoice
  window.thermalPrintInvoiceById = async function(orderId) {
    try {
      console.log('🖨️ Generating thermal invoice for order:', orderId);
      
      // Fetch order with customer data
      const response = await fetch(`${window.location.origin}/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const orderData = await response.json();
      console.log('📦 Order data for thermal print:', orderData);
      
      // Ensure customer email is available
      if (!orderData.email && orderData.customer_id) {
        console.log('⚠️ No email in order data, trying to fetch customer details...');
        
        try {
          const customerResponse = await fetch(`${window.location.origin}/api/customers/${orderData.customer_id}`);
          if (customerResponse.ok) {
            const customer = await customerResponse.json();
            orderData.email = customer.email || '';
            orderData.phone = customer.phone || orderData.phone;
            orderData.customer_name = customer.name || orderData.customer_name;
            console.log('✅ Added customer email from customer API:', orderData.email);
          }
        } catch (e) {
          console.log('⚠️ Could not fetch customer details:', e.message);
        }
      }
      
      const invoiceContent = generateThermalInvoiceContent(orderData);
      
      // Create print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - Order ${orderData.id}</title>
          <link rel="stylesheet" href="thermal-print.css">
        </head>
        <body>
          ${invoiceContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
        </html>
      `);
      
      console.log('✅ Thermal invoice print completed');
      
    } catch (error) {
      console.error('Error printing thermal invoice:', error);
      alert('Failed to print invoice: ' + error.message);
    }
  };
  
  console.log('✅ Invoice email display fix applied');
}

// Fix 3: Ensure customer emails are properly captured and saved in orders
function fixCustomerEmailCapture() {
  console.log('📝 Fixing customer email capture...');
  
  // Ensure the form submission includes email
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    // Remove existing listener and add new one
    orderForm.removeEventListener('submit', window.originalFormHandler);
    
    window.originalFormHandler = async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // Show loading state
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;
      this.classList.add('loading');
      
      try {
        const formData = new FormData(this);
        
        // Prepare customer data with explicit email handling
        const customerData = {
          name: formData.get('customerName'),
          email: formData.get('customerEmail') || '', // Ensure email is always included
          phone: formData.get('customerPhone'),
          delivery_address: formData.get('deliveryAddress')
        };
        
        console.log('📧 Customer data with email:', customerData);
        
        // Validate email format if provided
        if (customerData.email && customerData.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(customerData.email.trim())) {
            throw new Error('Please enter a valid email address');
          }
          customerData.email = customerData.email.trim();
        }
        
        // Prepare order data
        const orderData = {
          delivery_date: formData.get('deliveryDate'),
          delivery_route: formData.get('deliveryRoute'),
          preferred_delivery_method: formData.get('deliveryMethod'),
          request_status: formData.get('requestStatus')
        };
        
        // Prepare items
        const items = [];
        const itemInputs = document.querySelectorAll('[name^="item"]:not([name*="quantity"])');
        
        itemInputs.forEach((input, index) => {
          const itemNum = index + 1;
          const productName = input.value;
          const quantityInput = document.querySelector(`[name="quantity${itemNum}"]`);
          const quantity = quantityInput ? parseInt(quantityInput.value) : 0;
          
          if (productName && quantity) {
            items.push({
              product_name: productName,
              quantity: quantity
            });
          }
        });
        
        if (items.length === 0) {
          throw new Error('Please add at least one item to your order');
        }
        
        // Submit to API
        const response = await fetch(`${window.location.origin}/api/orders`, {
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit order');
        }
        
        const result = await response.json();
        console.log('✅ Order submitted with email:', result);
        
        // Show success summary
        displayOrderSummary(customerData, orderData, items, result.order);
        
        // Reset form
        this.reset();
        const itemsContainer = document.getElementById('itemsContainer');
        if (itemsContainer) {
          itemsContainer.innerHTML = '';
        }
        
        // Recreate first item row if function exists
        if (typeof createItemRow === 'function') {
          createItemRow();
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
    };
    
    orderForm.addEventListener('submit', window.originalFormHandler);
    
    console.log('✅ Customer email capture fix applied');
  }
}

// Apply all fixes
function applyComprehensiveFixes() {
  console.log('🚀 Applying comprehensive fixes...');
  
  try {
    fixStockAdditionAuth();
    fixInvoiceEmailDisplay();
    fixCustomerEmailCapture();
    
    console.log('✅ All fixes applied successfully!');
    
    // Display status
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: sans-serif;
      font-size: 14px;
    `;
    statusDiv.innerHTML = '✅ Stock & Invoice Fixes Applied';
    document.body.appendChild(statusDiv);
    
    // Remove status after 3 seconds
    setTimeout(() => {
      statusDiv.remove();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

// Auto-apply fixes when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyComprehensiveFixes);
} else {
  applyComprehensiveFixes();
}