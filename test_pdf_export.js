// Test PDF Export Functionality
// Run this in browser console to test PDF generation

async function testPDFExport() {
  console.log('🧪 Testing PDF Export Functionality...');
  
  // Test data
  const testOrderData = {
    id: 123,
    customer_name: 'Test Customer',
    email: 'test@example.com', 
    phone: '+234 801 234 5678',
    delivery_address: '123 Test Street, Lagos, Nigeria',
    company: 'Test Company Ltd',
    created_at: new Date().toISOString(),
    delivery_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    preferred_delivery_method: 'delivery',
    delivery_route: 'Please call before delivery',
    request_status: 'urgent',
    total_amount: 15750.00,
    items: [
      {
        product_name: 'Digital Thermometer',
        quantity: 2,
        unit_price: 2500.00
      },
      {
        product_name: 'Blood Pressure Monitor',
        quantity: 1,
        unit_price: 10250.00
      }
    ]
  };
  
  // Check if jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    console.error('❌ jsPDF library not loaded');
    return;
  }
  
  console.log('✅ jsPDF library loaded');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Test basic PDF generation
    doc.setFontSize(20);
    doc.text('ASTRO-BSM PDF Export Test', 20, 25);
    doc.setFontSize(12);
    doc.text('This is a test of the PDF export functionality', 20, 40);
    doc.text(`Customer: ${testOrderData.customer_name}`, 20, 55);
    doc.text(`Order Total: ₦${testOrderData.total_amount.toFixed(2)}`, 20, 70);
    
    // Test download
    doc.save('ASTRO-BSM_PDF_Export_Test.pdf');
    
    console.log('✅ PDF Export Test Successful!');
    console.log('📄 Test PDF downloaded as: ASTRO-BSM_PDF_Export_Test.pdf');
    
  } catch (error) {
    console.error('❌ PDF Export Test Failed:', error);
  }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 PDF Export Test Available');
  console.log('Run: testPDFExport()');
}
