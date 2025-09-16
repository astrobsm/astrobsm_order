// Authentication middleware for role-based access
const rolePermissions = {
    customer: [
        'place_orders',
        'view_products',
        'view_order_status'
    ],
    sales_staff: [
        'place_orders',
        'view_products', 
        'view_order_status',
        'view_all_orders',
        'generate_invoices',
        'generate_receipts',
        'view_notifications',
        'export_orders',
        'notifications'
    ],
    superadmin: [
        'place_orders',
        'view_products',
        'view_order_status', 
        'view_all_orders',
        'generate_invoices',
        'generate_receipts',
        'view_notifications',
        'export_orders',
        'manage_products',
        'manage_stock',
        'view_admin_panel',
        'system_settings',
        'priceChanges',
        'notifications'
    ]
};

// Legacy password check for backward compatibility during transition
const legacyPasswords = {
    adminPassword: 'pinkpetals',
    stockPassword: 'astro123',
    pricePassword: 'natiss2024'
};

function checkRole(requiredPermission) {
    return (req, res, next) => {
        try {
            const { userRole, adminPassword, stockPassword, pricePassword } = req.body;
            
            // Check role-based permission
            if (userRole && rolePermissions[userRole] && rolePermissions[userRole].includes(requiredPermission)) {
                req.userRole = userRole;
                return next();
            }
            
            // Legacy password fallback for transition period
            if (adminPassword && adminPassword === legacyPasswords.adminPassword) {
                req.userRole = 'superadmin';
                return next();
            }
            
            if (stockPassword && stockPassword === legacyPasswords.stockPassword) {
                req.userRole = 'superadmin';
                return next();
            }
            
            if (pricePassword && pricePassword === legacyPasswords.pricePassword) {
                req.userRole = 'superadmin';
                return next();
            }
            
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.',
                requiredPermission: requiredPermission
            });
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    };
}

function requireAdmin(req, res, next) {
    return checkRole('manage_products')(req, res, next);
}

function requireStockAccess(req, res, next) {
    return checkRole('manage_stock')(req, res, next);
}

function requirePriceChangeAccess(req, res, next) {
    return checkRole('priceChanges')(req, res, next);
}

function requireNotificationAccess(req, res, next) {
    return checkRole('notifications')(req, res, next);
}

module.exports = {
    checkRole,
    requireAdmin,
    requireStockAccess,
    requirePriceChangeAccess,
    requireNotificationAccess,
    rolePermissions
};