const http = require('http');

const testData = JSON.stringify({
    customerData: {
        name: 'Test Customer',
        phone: '1234567890',
        delivery_address: 'Test Address'
    },
    orderData: {
        delivery_date: '2025-09-10',
        preferred_delivery_method: 'pickup',
        request_status: 'urgent'
    },
    items: [
        { product_name: 'Silicone Scar Sheet (Packet)', quantity: 10 },
        { product_name: 'Hera Wound-Gel 40g (Carton)', quantity: 3 }
    ]
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    }
};

console.log('🧪 Testing HTTP API...');

const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 Response:', data);
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

req.write(testData);
req.end();
