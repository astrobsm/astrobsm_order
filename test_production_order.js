const http = require('http');

// Test the exact order that failed in production
const testData = JSON.stringify({
    customerData: {
        name: "EMMANUEL NNADI",
        email: "astrobsm@gmail.com",
        phone: "08033328385",
        delivery_address: "6B PEACE AVENUE FEDERAL HOUSING  TRANS EKULU"
    },
    orderData: {
        delivery_date: "2025-09-09",
        delivery_route: "fg",
        preferred_delivery_method: "delivery_enugu",
        request_status: "can_wait_24hrs"
    },
    items: [
        {
            product_name: "Coban Bandage 6 inch (Piece)",
            quantity: 5
        },
        {
            product_name: "Coban Bandage 6 inch (Carton)",
            quantity: 3
        }
    ],
    total: 307500
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

console.log('🧪 Testing exact production order locally...');

const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    
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
