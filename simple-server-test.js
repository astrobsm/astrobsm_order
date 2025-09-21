// Simple server test without all the initialization
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Simple server running on port ${PORT}`);
    console.log(`📱 Test at http://localhost:${PORT}`);
});

// Error handling
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('💥 Unhandled Rejection:', error);
});