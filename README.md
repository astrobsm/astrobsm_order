# ASTRO-BSM Order Management System

A professional Progressive Web Application (PWA) for managing medical supply orders for ASTRO-BSM Professional Medical Supplies.

## Features

### 🏥 **Order Management**
- Dynamic product selection with real-time pricing
- Automatic VAT calculation (2.5%)
- Professional invoice generation with company branding
- Total amount displayed in words (English/Nigerian format)
- Multiple delivery options and urgency levels
- Optional email field for customer notifications

### 💰 **Pricing & Payment**
- 24 medical products with accurate pricing
- Automatic subtotal, VAT, and total calculation
- Integrated payment instructions with bank account details
- Export orders as JPG images
- Print and share functionality (Email/WhatsApp)

### 🔐 **Admin Features**
- Secure admin panel (Password: `roseball`)
- View all customer orders with detailed information
- Product management (CRUD operations)
- Price editing with additional security (Password: `redvelvet`)
- Order status tracking and management

### 📱 **Progressive Web App (PWA)**
- Mobile-first responsive design
- Offline functionality with service worker
- Installable on mobile devices and desktop
- Fast loading and caching

## Product Catalog

The system includes 24 medical products across categories:

- **Wound Care Products**: Honey Gauze (Big/Small), Wound-Gel (100g/40g)
- **Bandages**: Coban Bandage (4"/6")
- **Specialty Items**: Silicone Scar Sheet, Silicone Foot Pad
- **Medical Supplies**: Sterile Dressing/Gauze Packs, Skin Staples, NPWT Foam, Opsite
- **Solutions**: Wound-Clex Solution 500ml

## Technology Stack

### **Backend**
- Node.js with Express.js
- PostgreSQL database
- RESTful API architecture
- Helmet for security (CSP configuration)

### **Frontend**
- Vanilla JavaScript (ES6+)
- Responsive CSS with mobile-first design
- Progressive Web App features
- html2canvas for image export

### **Database**
- PostgreSQL with proper schema design
- Foreign key relationships
- Data validation and constraints

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Git

### Environment Variables
Create a `.env` file with:
```env
# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=astrobsm_orders
DB_PASSWORD=your_db_password
DB_PORT=5432

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/astrobsm/astrobsm_order.git
   cd astrobsm_order
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run init
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open browser and navigate to `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get all orders (admin)
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get specific order details

### Admin
- `GET /api/admin/orders` - Admin order management
- `POST /api/admin/products` - Product management

## Deployment

### Digital Ocean Deployment

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Minimum 1GB RAM

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   ```

3. **Clone and Setup**
   ```bash
   git clone https://github.com/astrobsm/astrobsm_order.git
   cd astrobsm_order
   npm install
   ```

4. **Configure Database**
   ```bash
   sudo -u postgres createdb astrobsm_orders
   sudo -u postgres createuser --interactive
   ```

5. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

6. **Initialize Database**
   ```bash
   npm run init
   ```

7. **Setup Process Manager**
   ```bash
   sudo npm install -g pm2
   pm2 start server/server.js --name "astrobsm-order"
   pm2 startup
   pm2 save
   ```

8. **Configure Nginx (Optional)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Security Features

- Content Security Policy (CSP) implementation
- SQL injection prevention with parameterized queries
- XSS protection
- Password-protected admin areas
- Input validation and sanitization

## Business Information

**Company**: BONNESANTE MEDICALS  
**Payment Accounts**:
- Account 1: 8259518195 - MONIEPOINT MICROFINANCE BANK
- Account 2: 1379643548 - ACCESS BANK

**WhatsApp Support**: +234 707 679 3866

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is proprietary software developed for ASTRO-BSM Professional Medical Supplies.

## Support

For technical support or business inquiries, contact:
- Email: [Contact through GitHub Issues]
- WhatsApp: +234 707 679 3866

---

**ASTRO-BSM Professional Medical Supplies** - Your trusted partner in medical equipment and supplies.
