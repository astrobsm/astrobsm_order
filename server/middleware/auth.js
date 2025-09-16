// Authentication middleware for role-based access
const pool = require('../database/db');

// Cache for role permissions to avoid database hits on every request
let rolePermissionsCache = {};
let cacheLastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fallback static permissions for when database is not available
const fallbackRolePermissions = {
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
        'notifications',
        'manage_users'
    ]
};

// Load role permissions from database
async function loadRolePermissions() {
    try {
        const now = Date.now();
        
        // Return cached permissions if still valid
        if (Object.keys(rolePermissionsCache).length > 0 && (now - cacheLastUpdated) < CACHE_DURATION) {
            return rolePermissionsCache;
        }
        
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT role_name, permissions 
                FROM user_roles 
                WHERE is_active = true
            `);
            
            const permissions = {};
            for (const row of result.rows) {
                permissions[row.role_name] = row.permissions;
            }
            
            // Update cache
            rolePermissionsCache = permissions;
            cacheLastUpdated = now;
            
            return permissions;
            
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error loading role permissions from database, using fallback:', error.message);
        return fallbackRolePermissions;
    }
}

// Legacy password check for backward compatibility during transition
const legacyPasswords = {
    adminPassword: 'pinkpetals',
    stockPassword: 'astro123',
    pricePassword: 'natiss2024'
};

function checkRole(requiredPermission) {
    return async (req, res, next) => {
        try {
            console.log(`🔐 Auth middleware: checking permission '${requiredPermission}'`);
            console.log(`🔐 Request body:`, req.body);
            
            const { userRole, adminPassword, stockPassword, pricePassword } = req.body;
            
            // Load current role permissions from database
            const rolePermissions = await loadRolePermissions();
            
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
    requireNotificationAccess
};