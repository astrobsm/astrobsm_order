# Thermal Printing Guide - XP-P300 (58mm)

## Overview
The ASTRO-BSM Order Management System now supports thermal printing for order summaries and invoices using the XP-P300 thermal printer with 58mm paper width.

## Features Implemented

### 1. Thermal Print CSS (`thermal-print.css`)
- Optimized for 58mm paper width (210px)
- Monospace fonts for consistent character spacing
- Proper margins and padding for thermal printers
- Print-specific media queries
- Compact layout design

### 2. Order Summary Thermal Printing
- **Button Location**: Order summary section
- **Function**: `thermalPrintOrder(customerData, orderData, items, order)`
- **Features**:
  - Company header with ASTRO-BSM branding
  - Order details (ID, date, time)
  - Customer information
  - Itemized product list with quantities and prices
  - Subtotal, tax (10%), and total calculations
  - Thank you message and QR code placeholder

### 3. Admin Panel Thermal Printing
- **Order Print Button**: 🖨️ Print Order
- **Invoice Print Button**: 🧾 Print Invoice
- **Functions**: 
  - `thermalPrintOrderById(orderId)` - For order receipts
  - `thermalPrintInvoiceById(orderId)` - For invoices

### 4. Invoice Thermal Printing
- Professional invoice format
- Invoice number (INV-{orderID})
- Bill-to information
- Payment terms and due dates
- Late fee information
- Enhanced formatting for business use

## How to Use

### For Orders (Customer-facing)
1. Complete an order through the form
2. In the order summary, click the **🖨️ Thermal Print** button
3. A print preview window will open
4. Click **Print Receipt** to send to thermal printer
5. Ensure XP-P300 is connected and has 58mm paper loaded

### For Admin (Order Management)
1. Access admin panel with password
2. Locate the order in the orders list
3. Click **🖨️ Print Order** for order receipt
4. Click **🧾 Print Invoice** for formal invoice
5. Print preview window opens automatically

## Technical Specifications

### Paper Size
- **Width**: 58mm (210px in CSS)
- **Compatible Printer**: XP-P300
- **Margin**: 5mm (18px) on each side
- **Content Width**: 48mm (174px)

### CSS Classes
```css
.thermal-receipt     - Main container
.receipt-header      - Company name and info
.receipt-section     - Content sections
.section-title       - Section headers
.info-line          - Information lines
.item-row           - Product items
.total-line         - Price totals
.separator          - Divider lines
.receipt-footer     - Footer content
.qr-section         - QR code area
```

### Print Settings
- **Font**: Monospace for consistent spacing
- **Font Size**: 12px primary, 10px secondary
- **Line Height**: 1.2 for compact layout
- **Margins**: 0 for full paper usage
- **Background**: White, no colors for thermal compatibility

## Printer Setup

### XP-P300 Configuration
1. Install XP-P300 drivers
2. Set paper size to 58mm
3. Configure print settings:
   - Paper Type: Thermal
   - Quality: Draft (for speed)
   - Margins: None
   - Scale: 100%

### Browser Print Settings
1. Set margins to "None" or "Minimum"
2. Disable headers and footers
3. Enable background graphics (if needed)
4. Select correct printer (XP-P300)

## Troubleshooting

### Common Issues

**Print content too wide**
- Solution: Check CSS media queries are loading
- Verify paper size is set to 58mm in printer settings

**Text too small/large**
- Solution: Adjust font sizes in `thermal-print.css`
- Test with different browsers

**Printer not responding**
- Solution: Check USB connection
- Verify printer drivers are installed
- Test with Windows test page

**Content cut off**
- Solution: Adjust margins in print settings
- Check paper loaded correctly
- Verify printer settings match CSS

### CSS Customization
To modify the thermal print layout:

1. Edit `thermal-print.css`
2. Adjust `.thermal-receipt` width for different paper sizes
3. Modify font sizes in media queries
4. Update spacing and padding as needed

### Adding Custom Content
To add custom fields to receipts:

1. Edit `generateThermalPrintContent()` function in `app.js`
2. Add new info lines in appropriate sections
3. Update CSS if needed for styling

## Files Modified
- `thermal-print.css` - Thermal printer specific styles
- `app.js` - Print functions and event handlers
- `index.html` - CSS link and button structure
- `style.css` - Button styling and responsive design

## Future Enhancements
- QR code generation for order tracking
- Logo image integration (if supported by thermal printer)
- Multiple paper size support (58mm, 80mm)
- Print queue management
- Automatic paper cutting commands
- Barcode generation for products