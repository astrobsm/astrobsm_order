// Authentication and Role Management System
class AuthManager {
    constructor() {
        this.currentAuth = null;
        this.init();
    }

    async init() {
        this.loadAuthFromStorage();
        await this.setupAuthCheck();
    }

    loadAuthFromStorage() {
        try {
            const authData = localStorage.getItem('astro_auth');
            if (authData) {
                const auth = JSON.parse(authData);
                
                // Check if auth is still valid (24 hours)
                const loginTime = new Date(auth.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24 && auth.authenticated) {
                    this.currentAuth = auth;
                    return true;
                } else {
                    this.logout();
                    return false;
                }
            }
        } catch (error) {
            console.error('Error loading auth:', error);
            this.logout();
        }
        return false;
    }

    async setupAuthCheck() {
        // Check authentication on page load
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }

        // Apply role-based UI modifications
        await this.applyRoleBasedUI();
        
        // Set up periodic auth check (every 5 minutes)
        setInterval(() => {
            if (!this.loadAuthFromStorage()) {
                this.redirectToLogin();
            }
        }, 5 * 60 * 1000);
    }

    isAuthenticated() {
        return this.currentAuth && this.currentAuth.authenticated;
    }

    getCurrentRole() {
        return this.currentAuth ? this.currentAuth.role : null;
    }

    hasRole(role) {
        return this.getCurrentRole() === role;
    }

    hasAnyRole(roles) {
        return roles.includes(this.getCurrentRole());
    }

    async canAccess(permission) {
        const role = this.getCurrentRole();
        
        // If we have cached permissions in the current auth, use them
        if (this.currentAuth && this.currentAuth.permissions) {
            return this.currentAuth.permissions.includes(permission);
        }
        
        // Fallback to static permissions if no cached permissions
        const fallbackPermissions = {
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

        return fallbackPermissions[role] && fallbackPermissions[role].includes(permission);
    }

    async loadAvailableRoles() {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                return data.roles || [];
            }
        } catch (error) {
            console.warn('Could not load dynamic roles, using defaults:', error);
        }
        
        // Return default roles if API fails
        return [
            {
                role_name: 'customer',
                role_display_name: 'Customer',
                description: 'Place orders and view products',
                requires_password: false
            },
            {
                role_name: 'sales_staff', 
                role_display_name: 'Sales Staff',
                description: 'View orders and generate documents',
                requires_password: true
            },
            {
                role_name: 'superadmin',
                role_display_name: 'Super Administrator', 
                description: 'Full system access',
                requires_password: true
            }
        ];
    }

    async authenticateWithAPI(role, password = null) {
        try {
            const response = await fetch('/api/users/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role_name: role,
                    password: password
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.sessionData) {
                    // Store the complete session data with permissions
                    this.currentAuth = {
                        ...data.sessionData,
                        role: data.sessionData.role,
                        permissions: data.sessionData.permissions,
                        authenticated: true,
                        loginTime: new Date().toISOString()
                    };
                    
                    localStorage.setItem('astro_auth', JSON.stringify(this.currentAuth));
                    return { success: true, auth: this.currentAuth };
                }
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Authentication failed' };
            }
        } catch (error) {
            console.error('API authentication error:', error);
            return { success: false, error: 'Network error during authentication' };
        }
        
        return { success: false, error: 'Authentication failed' };
    }

    async applyRoleBasedUI() {
        const role = this.getCurrentRole();
        
        console.log(`🔐 Applying UI restrictions for role: ${role}`);
        
        // Hide/show elements based on role permissions
        await this.toggleElementsByPermission('place_orders', '.order-form, #orderForm, .customer-section');
        await this.toggleElementsByPermission('view_all_orders', '.admin-panel, #adminPanel, .btn-admin, #adminBtn');
        await this.toggleElementsByPermission('manage_products', '.product-management, #productManagement');
        await this.toggleElementsByPermission('manage_stock', '.stock-management, #stockManagement');
        await this.toggleElementsByPermission('view_notifications', '.notification-section, #notificationSection, .btn-notification, #notificationBtn');
        
        // Apply strict customer restrictions
        if (role === 'customer') {
            console.log('🔒 Applying customer restrictions...');
            this.applyCustomerRestrictions();
        }
        
        // Update header based on role
        this.updateHeaderForRole();
        
        // Add role indicator
        this.addRoleIndicator();
        
        // Remove old password inputs
        this.removeOldPasswordInputs();
        
        console.log(`✅ UI configured for role: ${role}`);
    }

    applyCustomerRestrictions() {
        // Hide admin elements that customers should never see
        const restrictedSelectors = [
            '#adminBtn', '.btn-admin',
            '#notificationBtn', '.btn-notification',
            '.admin-panel', '#adminPanel',
            '.user-management', '#userManagement',
            '.stock-management', '#stockManagement', 
            '.product-management', '#productManagement',
            '.price-management', '#priceManagement',
            '.notification-center', '#notificationCenter',
            '.admin-controls', '.management-controls'
        ];
        
        restrictedSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.setAttribute('disabled', 'true');
            });
        });
        
        console.log('🔒 Customer restrictions applied - admin features hidden');
    }

    async toggleElementsByPermission(permission, selector) {
        const elements = document.querySelectorAll(selector);
        const canAccess = await this.canAccess(permission);
        
        console.log(`🔍 Permission check: ${permission} = ${canAccess} for role ${this.getCurrentRole()}`);
        
        elements.forEach(element => {
            if (canAccess) {
                element.style.display = '';
                element.removeAttribute('disabled');
            } else {
                element.style.display = 'none';
                element.setAttribute('disabled', 'true');
            }
        });
    }

    updateHeaderForRole() {
        const role = this.getCurrentRole();
        const roleNames = {
            customer: 'Customer Portal',
            sales_staff: 'Sales Dashboard', 
            superadmin: 'Admin Dashboard'
        };

        // Update page title
        document.title = `${roleNames[role]} - ASTRO-BSM`;
        
        // Update header text if it exists
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.textContent = `ASTRO-BSM ${roleNames[role]}`;
        }
    }

    addRoleIndicator() {
        const role = this.getCurrentRole();
        const roleNames = {
            customer: 'Customer',
            sales_staff: 'Sales Staff',
            superadmin: 'Super Admin'
        };

        const roleColors = {
            customer: '#10b981',
            sales_staff: '#3b82f6', 
            superadmin: '#dc2626'
        };

        // Create role indicator
        const existingIndicator = document.getElementById('roleIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const roleIndicator = document.createElement('div');
        roleIndicator.id = 'roleIndicator';
        roleIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: ${roleColors[role]};
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>${roleNames[role]}</span>
                <button onclick="authManager.logout()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " title="Logout">×</button>
            </div>
        `;
        document.body.appendChild(roleIndicator);
    }

    removeOldPasswordInputs() {
        // Remove old admin password inputs
        const oldPasswordSections = document.querySelectorAll('#passwordSection, .password-section, .admin-password');
        oldPasswordSections.forEach(section => {
            section.remove();
        });

        // Remove old password modals
        const oldPasswordModals = document.querySelectorAll('#adminPasswordModal, .password-modal');
        oldPasswordModals.forEach(modal => {
            modal.remove();
        });
    }

    logout() {
        localStorage.removeItem('astro_auth');
        this.currentAuth = null;
        
        // Show logout message briefly
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1e3a8a;
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
        `;
        message.textContent = 'Logging out...';
        document.body.appendChild(message);
        
        setTimeout(() => {
            this.redirectToLogin();
        }, 1000);
    }

    redirectToLogin() {
        // Check if already on login page
        if (window.location.pathname.includes('login.html')) {
            return;
        }
        
        window.location.href = 'login.html';
    }

    // Utility method to check role in templates
    checkRole(requiredRole) {
        return this.hasRole(requiredRole);
    }

    // Utility method to check multiple roles
    checkAnyRole(roles) {
        return this.hasAnyRole(roles);
    }

    // Utility method to check permissions
    checkPermission(permission) {
        return this.canAccess(permission);
    }
}

// Initialize global auth manager
const authManager = new AuthManager();

// Ensure proper async initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await authManager.init();
    });
} else {
    // DOM is already loaded
    (async () => {
        await authManager.init();
    })();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

console.log('🔐 Authentication system initialized');