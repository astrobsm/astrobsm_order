# ASTRO-BSM Product Order Application

A modern, responsive Progressive Web App (PWA) for ASTRO-BSM product ordering with PostgreSQL backend.

## Features

- **Mobile-First Responsive Design** - Optimized for all screen sizes
- **PostgreSQL Database** - Robust data storage for customers, products, and orders
- **RESTful API** - Express.js backend with comprehensive endpoints
- **PWA Support** - Installable app with offline capabilities
- **Dynamic Order Form** - Add/remove items dynamically
- **Professional UI** - Matches company logo color scheme

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Additional**: Service Worker for PWA functionality

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Ensure PostgreSQL is running
   - Create database: `astro_order_db`
   - Update `.env` file with your database credentials
   - Run database setup:
   ```bash
   npm run setup-db
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update database credentials:
     - DB_USER: postgres
     - DB_PASSWORD: natiss_natiss
     - DB_NAME: astro_order_db

## Usage

1. **Start the Application**
   ```bash
   npm start
   ```
   
2. **Development Mode**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open browser to `http://localhost:3000`
   - The app is fully responsive and works on all devices

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID with items

### Health Check
- `GET /api/health` - Service health status

## Database Schema

### Tables
- **customers**: Customer information
- **products**: Product catalog with pricing
- **orders**: Order headers
- **order_items**: Individual order line items

## PWA Features

- **Installable**: Can be installed on mobile devices and desktops
- **Offline Support**: Basic functionality works without internet
- **Responsive**: Adapts to all screen sizes
- **App-like Experience**: Full-screen, native-like interface

## Mobile Responsiveness

- **Small Phones** (320px+): Optimized layout with stacked elements
- **Tablets** (768px+): Two-column layouts where appropriate
- **Desktops** (1024px+): Full desktop experience

## Order Process

1. Customer fills in contact details
2. Adds products using dropdown selection
3. Specifies quantities for each item
4. Submits order
5. Receives confirmation with order ID
6. Sends payment evidence to WhatsApp: +234 707 679 3866

## Development

The application follows modern web development best practices:
- Semantic HTML structure
- CSS Grid and Flexbox for layouts
- Progressive enhancement
- Accessibility features
- Mobile-first responsive design

## License

MIT License - See LICENSE file for details

## Support

For technical support, contact the development team or refer to the API documentation.
