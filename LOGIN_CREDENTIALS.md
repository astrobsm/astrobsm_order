# ASTRO-BSM Login Credentials

## Default Login Credentials

### Sales Staff
- **Role**: `sales_staff`
- **Password**: `unicorn`
- **Permissions**: Place orders, view products, view orders, generate invoices/receipts

### Super Administrator
- **Role**: `superadmin`
- **Password**: `natiss`
- **Permissions**: Full system access including user management and all other functions

### Customer
- **Role**: `customer`
- **Password**: (No password required)
- **Permissions**: Place orders, view products, view order status

## Authentication Issue Resolution

The 401 error you saw was because the `sales_staff` role requires a password. Use the credentials above to login.

## Server Status
- Server is running on: http://localhost:3000
- Login page: http://localhost:3000/login.html
- Main app: http://localhost:3000/index.html
