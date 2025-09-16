// Payment Receipt Generation System
// Generates payment receipts when customers make payments

// Generate Payment Receipt for an Order
async function generatePaymentReceipt(orderId, paymentDetails = {}) {
  try {
    console.log('Generating payment receipt for order ID:', orderId);
    
    // Fetch complete order details
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    
    const orderData = await response.json();
    console.log('Order data for payment receipt:', orderData);
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Receipt Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('PAYMENT RECEIPT', 105, 25, null, null, 'center');
    
    // Company information
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ASTRO-BSM PROFESSIONAL MEDICAL SUPPLIES', 105, 40, null, null, 'center');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Equipment • Laboratory Supplies • Healthcare Solutions', 105, 50, null, null, 'center');
    
    // Receipt details
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    let yPos = 70;
    
    doc.text(`Receipt #: RCP-${orderId}-${Date.now().toString().slice(-6)}`, 20, yPos);
    yPos += 8;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 8;
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, yPos);
    yPos += 8;
    doc.text(`Order #: ${orderId}`, 20, yPos);
    
    // Customer information
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED FROM:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    doc.text(`Name: ${orderData.customer_name}`, 25, yPos);
    yPos += 6;
    if (orderData.email) {
      doc.text(`Email: ${orderData.email}`, 25, yPos);
      yPos += 6;
    }
    doc.text(`Phone: ${orderData.phone}`, 25, yPos);
    yPos += 6;
    if (orderData.company) {
      doc.text(`Company: ${orderData.company}`, 25, yPos);
      yPos += 6;
    }
    
    // Payment details
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    
    // Calculate totals
    let subtotal = 0;
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach(item => {
        const price = parseFloat(item.price || item.unit_price || 0);
        const itemTotal = price * parseInt(item.quantity);
        subtotal += itemTotal;
      });
    }
    
    const vat = subtotal * 0.025;
    const total = subtotal + vat;
    
    // Payment method and reference
    const paymentMethod = paymentDetails.method || 'Bank Transfer';
    const paymentReference = paymentDetails.reference || 'Not provided';
    const paymentDate = paymentDetails.date || new Date().toLocaleDateString();
    
    doc.text(`Payment Method: ${paymentMethod}`, 25, yPos);
    yPos += 6;
    doc.text(`Payment Reference: ${paymentReference}`, 25, yPos);
    yPos += 6;
    doc.text(`Payment Date: ${paymentDate}`, 25, yPos);
    yPos += 10;
    
    // Amount breakdown
    doc.text(`Subtotal: ₦${subtotal.toFixed(2)}`, 25, yPos);
    yPos += 6;
    doc.text(`VAT (2.5%): ₦${vat.toFixed(2)}`, 25, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`TOTAL AMOUNT PAID: ₦${total.toFixed(2)}`, 25, yPos);
    
    // Amount in words
    yPos += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const amountInWords = nairaConverter.convertAmountToWords(total);
    const wordsLines = doc.splitTextToSize(`Amount in Words: ${amountInWords}`, 170);
    doc.text(wordsLines, 20, yPos);
    yPos += wordsLines.length * 6;
    
    // Order items summary
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEMS PAID FOR:', 20, yPos);
    yPos += 8;
    
    // Items table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Unit Price', 140, yPos);
    doc.text('Total', 170, yPos);
    yPos += 6;
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    // Items list
    doc.setFont('helvetica', 'normal');
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach(item => {
        const price = parseFloat(item.price || item.unit_price || 0);
        const itemTotal = price * parseInt(item.quantity);
        
        doc.text(item.product_name, 25, yPos);
        doc.text(item.quantity.toString(), 125, yPos);
        doc.text(`₦${price.toFixed(2)}`, 140, yPos);
        doc.text(`₦${itemTotal.toFixed(2)}`, 170, yPos);
        yPos += 6;
      });
    }
    
    // Payment confirmation section
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('PAYMENT INFORMATION:', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Account Name: BONNESANTE MEDICALS', 25, yPos);
    yPos += 6;
    doc.text('Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK', 25, yPos);
    yPos += 6;
    doc.text('Account 2: 1379643548 - ACCESS BANK', 25, yPos);
    
    // Receipt footer
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('*** PAYMENT RECEIVED - THANK YOU ***', 105, yPos, null, null, 'center');
    
    yPos += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('This is an official payment receipt. Keep for your records.', 105, yPos, null, null, 'center');
    yPos += 6;
    doc.text('For inquiries, contact us at: info@astrobsm.com', 105, yPos, null, null, 'center');
    
    // Generate filename and save
    const receiptDate = new Date().toISOString().split('T')[0];
    const safeCustomerName = orderData.customer_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ASTRO-BSM_Payment_Receipt_${orderId}_${safeCustomerName}_${receiptDate}.pdf`;
    
    doc.save(filename);
    
    console.log('Payment receipt generated successfully:', filename);
    return true;
    
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    throw error;
  }
}

// Generate Payment Receipt with Payment Details Modal
function showPaymentReceiptModal(orderId) {
  // Create modal HTML
  const modalHTML = `
    <div id="paymentReceiptModal" class="modal-overlay" style="display: block;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Generate Payment Receipt</h3>
          <span class="modal-close" onclick="closePaymentReceiptModal()">&times;</span>
        </div>
        <div class="modal-body">
          <form id="paymentReceiptForm">
            <div class="form-group">
              <label for="paymentMethod">Payment Method:</label>
              <select id="paymentMethod" required>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online Transfer">Online Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>
            <div class="form-group">
              <label for="paymentReference">Payment Reference/Transaction ID:</label>
              <input type="text" id="paymentReference" placeholder="e.g., TXN123456789" required>
            </div>
            <div class="form-group">
              <label for="paymentDate">Payment Date:</label>
              <input type="date" id="paymentDate" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label for="paymentNotes">Additional Notes (optional):</label>
              <textarea id="paymentNotes" placeholder="Any additional notes about the payment..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closePaymentReceiptModal()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="generateReceiptFromModal(${orderId})">Generate Receipt</button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close payment receipt modal
function closePaymentReceiptModal() {
  const modal = document.getElementById('paymentReceiptModal');
  if (modal) {
    modal.remove();
  }
}

// Generate receipt from modal data
async function generateReceiptFromModal(orderId) {
  try {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentReference = document.getElementById('paymentReference').value;
    const paymentDate = document.getElementById('paymentDate').value;
    const paymentNotes = document.getElementById('paymentNotes').value;
    
    if (!paymentReference.trim()) {
      alert('Please enter a payment reference/transaction ID');
      return;
    }
    
    const paymentDetails = {
      method: paymentMethod,
      reference: paymentReference,
      date: new Date(paymentDate).toLocaleDateString(),
      notes: paymentNotes
    };
    
    await generatePaymentReceipt(orderId, paymentDetails);
    
    // Close modal
    closePaymentReceiptModal();
    
    // Update order status to paid (if backend supports it)
    try {
      await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: 'paid',
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          payment_date: paymentDate,
          payment_notes: paymentNotes
        })
      });
    } catch (updateError) {
      console.log('Could not update payment status in backend:', updateError);
    }
    
    // Show success message
    alert('Payment receipt generated successfully!');
    
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    alert('Error generating payment receipt: ' + error.message);
  }
}