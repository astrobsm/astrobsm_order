const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../database/db');
const { checkRole } = require('../middleware/auth');

// Middleware to ensure only superadmin can access user management
const requireSuperAdmin = checkRole('manage_users');

// Get all user roles
router.get('/', async (req, res) => {
  console.log('📊 GET /users request received');
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id, role_name, role_display_name, description, permissions, 
          requires_password, is_active, created_at, updated_at
        FROM user_roles 
        WHERE is_active = true
        ORDER BY role_name
      `);
      
      res.json({
        success: true,
        roles: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user roles',
      details: error.message 
    });
  }
});

// Create new user role OR list users (POST for auth compatibility)
router.post('/', requireSuperAdmin, async (req, res) => {
  const { action } = req.body;
  
  console.log('📊 User management POST request:', { action, bodyKeys: Object.keys(req.body) });
  
  // Handle list action for GET-like functionality with auth
  if (action === 'list') {
    console.log('📊 Handling list action...');
    try {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT 
            id, role_name, role_display_name, description, permissions, 
            requires_password, is_active, created_at, updated_at
          FROM user_roles 
          WHERE is_active = true
          ORDER BY role_name
        `);
        
        res.json({
          success: true,
          roles: result.rows
        });
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user roles',
        details: error.message 
      });
    }
    return;
  }
  
  // Handle create new role
  try {
    const { 
      role_name, 
      role_display_name, 
      description, 
      permissions, 
      password, 
      requires_password = true 
    } = req.body;

    if (!role_name || !role_display_name || !permissions) {
      return res.status(400).json({
        success: false,
        error: 'Role name, display name, and permissions are required'
      });
    }

    if (requires_password && !password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required for roles that require authentication'
      });
    }

    const client = await pool.connect();
    
    try {
      // Hash password if provided
      let password_hash = null;
      if (password && requires_password) {
        password_hash = await bcrypt.hash(password, 10);
      }

      const result = await client.query(`
        INSERT INTO user_roles (
          role_name, role_display_name, description, permissions, 
          password_hash, requires_password
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, role_name, role_display_name, description, permissions, requires_password
      `, [
        role_name.toLowerCase().replace(/\s+/g, '_'),
        role_display_name,
        description,
        JSON.stringify(permissions),
        password_hash,
        requires_password
      ]);

      // Log audit trail
      await client.query(`
        INSERT INTO user_management_audit (action, role_name, changed_by, change_details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'CREATE_ROLE',
        role_name,
        req.userRole || 'superadmin',
        JSON.stringify({ role_display_name, permissions, requires_password }),
        req.ip
      ]);

      res.status(201).json({
        success: true,
        message: 'User role created successfully',
        role: result.rows[0]
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user role:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        error: 'Role name already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create user role',
        details: error.message
      });
    }
  }
});

// Update user role
router.put('/:roleId', requireSuperAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { 
      role_display_name, 
      description, 
      permissions, 
      is_active 
    } = req.body;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE user_roles 
        SET 
          role_display_name = COALESCE($1, role_display_name),
          description = COALESCE($2, description),
          permissions = COALESCE($3, permissions),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, role_name, role_display_name, description, permissions, is_active
      `, [
        role_display_name,
        description,
        permissions ? JSON.stringify(permissions) : null,
        is_active,
        roleId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User role not found'
        });
      }

      // Log audit trail
      await client.query(`
        INSERT INTO user_management_audit (action, role_name, changed_by, change_details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'UPDATE_ROLE',
        result.rows[0].role_name,
        req.userRole || 'superadmin',
        JSON.stringify({ role_display_name, permissions, is_active }),
        req.ip
      ]);

      res.json({
        success: true,
        message: 'User role updated successfully',
        role: result.rows[0]
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      details: error.message
    });
  }
});

// Change password for a role
router.patch('/:roleId/password', requireSuperAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const client = await pool.connect();
    
    try {
      // Hash the new password
      const password_hash = await bcrypt.hash(password, 10);

      const result = await client.query(`
        UPDATE user_roles 
        SET 
          password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND requires_password = true
        RETURNING id, role_name, role_display_name
      `, [password_hash, roleId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User role not found or password change not allowed'
        });
      }

      // Log audit trail (without password details)
      await client.query(`
        INSERT INTO user_management_audit (action, role_name, changed_by, change_details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'CHANGE_PASSWORD',
        result.rows[0].role_name,
        req.userRole || 'superadmin',
        JSON.stringify({ action: 'password_changed' }),
        req.ip
      ]);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: error.message
    });
  }
});

// Authenticate user with role and password
router.post('/authenticate', async (req, res) => {
  try {
    const { role_name, password } = req.body;

    if (!role_name) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id, role_name, role_display_name, permissions, 
          password_hash, requires_password, is_active
        FROM user_roles 
        WHERE role_name = $1 AND is_active = true
      `, [role_name]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Invalid role'
        });
      }

      const role = result.rows[0];

      // Check if password is required
      if (role.requires_password) {
        if (!password) {
          return res.status(400).json({
            success: false,
            error: 'Password is required for this role'
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, role.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            error: 'Invalid password'
          });
        }
      }

      // Generate session (you could implement JWT here)
      const sessionData = {
        role: role.role_name,
        roleDisplayName: role.role_display_name,
        permissions: role.permissions,
        authenticated: true,
        loginTime: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Authentication successful',
        sessionData
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// Get audit log
router.get('/audit', requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id, action, role_name, changed_by, change_details, 
          ip_address, created_at
        FROM user_management_audit 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const countResult = await client.query('SELECT COUNT(*) FROM user_management_audit');
      
      res.json({
        success: true,
        audit_logs: result.rows,
        total_count: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      details: error.message
    });
  }
});

// Delete user role (soft delete)
router.delete('/:roleId', requireSuperAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE user_roles 
        SET 
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND role_name NOT IN ('customer', 'sales_staff', 'superadmin')
        RETURNING id, role_name, role_display_name
      `, [roleId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User role not found or cannot be deleted (protected role)'
        });
      }

      // Log audit trail
      await client.query(`
        INSERT INTO user_management_audit (action, role_name, changed_by, change_details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'DELETE_ROLE',
        result.rows[0].role_name,
        req.userRole || 'superadmin',
        JSON.stringify({ action: 'soft_delete' }),
        req.ip
      ]);

      res.json({
        success: true,
        message: 'User role deleted successfully'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user role',
      details: error.message
    });
  }
});

// Public endpoint for login page to get available roles (no auth required)
router.get('/public/roles', async (req, res) => {
  try {
    console.log('📊 Public roles request received');
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          role_name, role_display_name, description, requires_password
        FROM user_roles 
        WHERE is_active = true
        ORDER BY 
          CASE role_name 
            WHEN 'customer' THEN 1
            WHEN 'sales_staff' THEN 2  
            WHEN 'superadmin' THEN 3
            ELSE 4
          END
      `);
      
      res.json({
        success: true,
        roles: result.rows
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching public roles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch roles',
      details: error.message 
    });
  }
});

module.exports = router;