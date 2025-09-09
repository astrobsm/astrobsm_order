const https = require('https');
const http = require('http');

async function testAPI() {
    const testData = {
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
            { product_name: 'Silicone Scar Sheet (Packet)', quantity: 1 }
        ]
    };

    const postData = JSON.stringify(testData);

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        console.log('🧪 Testing API with data:', JSON.stringify(testData, null, 2));
        
        const req = http.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);
            
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            
            res.on('end', () => {
                console.log(`📄 Response: ${responseBody}`);
                resolve({ status: res.statusCode, body: responseBody });
            });
        });

        req.on('error', (err) => {
            console.error('❌ Request error:', err.message);
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

testAPI().then(() => {
    console.log('✅ Test completed');
}).catch(err => {
    console.error('❌ Test failed:', err.message);
}).finally(() => {
    setTimeout(() => process.exit(0), 1000);
});
