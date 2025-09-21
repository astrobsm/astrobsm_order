// ===== USER MANAGEMENT SYSTEM - COMPLETELY REBUILT =====

// Global variables for user management
let allUsers = [];
let filteredUsers = [];
let currentEditingUser = null;

// Helper function to get current user role
function getCurrentUserRole() {
  return window.currentUserRole || 'superadmin';
}

// Initialize User Management System
function initializeUserManagement() {
  console.log('🚀 Initializing User Management System...');
  
  // Hide all other sections first
  hideAllSections();
  
  // Show and setup user management section
  const userManagementSection = document.getElementById('userManagementSection');
  if (!userManagementSection) {
    console.error('❌ User Management section not found');
    alert('User Management interface not available. Please refresh the page.');
    return;
  }
  
  // Make user management section visible and prevent hiding
  userManagementSection.style.display = 'block';
  userManagementSection.style.position = 'relative';
  userManagementSection.style.zIndex = '1000';
  
  // Add click event to prevent bubbling and hiding
  userManagementSection.onclick = function(e) {
    e.stopPropagation();
    console.log('🛡️ Prevented click from bubbling up from User Management section');
  };
  
  // Clear any existing event listeners and setup new ones
  setupUserManagementEventListeners();
  
  // Load user data
  loadAllUsers();
  
  // Scroll to section
  userManagementSection.scrollIntoView({ behavior: 'smooth' });
  
  console.log('✅ User Management System initialized and protected from hiding');
}

// Hide all sections except user management
function hideAllSections() {
  console.log('🙈 Hiding all sections to show User Management');
  
  const sectionsToHide = [
    'adminModal', 'ordersSection', 'productsSection', 'stockSection'
  ];
  
  sectionsToHide.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'none';
    }
  });
}

// Setup all event listeners for user management
function setupUserManagementEventListeners() {
  console.log('🔗 Setting up User Management event listeners...');
  
  // Remove existing listeners by cloning buttons
  removeExistingListeners();
  
  // Setup new listeners
  setupHeaderEventListeners();
  setupSearchAndFilterListeners();
  setupModalEventListeners();
  setupFormEventListeners();
  setupUserCardListeners();
}

// Remove existing event listeners by cloning elements
function removeExistingListeners() {
  const buttonsToClean = ['addNewUserBtn', 'backToAdminBtn'];
  
  buttonsToClean.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
    }
  });
}

function setupHeaderEventListeners() {
  console.log('🔗 Setting up header event listeners...');
  
  // Add New User button
  const addNewUserBtn = document.getElementById('addNewUserBtn');
  if (addNewUserBtn) {
    console.log('✅ Found Add New User button, adding event listener');
    addNewUserBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎯 Add New User button clicked - event triggered!');
      showUserModal('add');
    });
    
    // Test button responsiveness
    addNewUserBtn.addEventListener('mouseenter', () => {
      console.log('🖱️ Mouse entered Add New User button');
    });
    
    console.log('✅ Add New User button listeners added');
  } else {
    console.error('❌ Add New User button not found in DOM');
  }
  
  // Back to Admin button
  const backToAdminBtn = document.getElementById('backToAdminBtn');
  if (backToAdminBtn) {
    console.log('✅ Found Back to Admin button, adding event listener');
    backToAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎯 Back to Admin button clicked - event triggered!');
      hideUserManagement();
    });
    
    // Test button responsiveness
    backToAdminBtn.addEventListener('mouseenter', () => {
      console.log('🖱️ Mouse entered Back to Admin button');
    });
    
    console.log('✅ Back to Admin button listeners added');
  } else {
    console.error('❌ Back to Admin button not found in DOM');
  }
}

function setupSearchAndFilterListeners() {
  console.log('🔍 Setting up search and filter listeners...');
  
  // Search input
  const userSearchInput = document.getElementById('userSearchInput');
  if (userSearchInput) {
    console.log('✅ Found userSearchInput, adding listener');
    userSearchInput.addEventListener('input', (e) => {
      console.log('🔍 Search input changed:', e.target.value);
      filterUsers(e.target.value, document.getElementById('roleFilterSelect').value);
    });
  } else {
    console.error('❌ userSearchInput not found');
  }
  
  // Role filter
  const roleFilterSelect = document.getElementById('roleFilterSelect');
  if (roleFilterSelect) {
    console.log('✅ Found roleFilterSelect, adding listener');
    roleFilterSelect.addEventListener('change', (e) => {
      console.log('🏷️ Role filter changed:', e.target.value);
      filterUsers(document.getElementById('userSearchInput').value, e.target.value);
    });
  } else {
    console.error('❌ roleFilterSelect not found');
  }
}

function setupModalEventListeners() {
  // User Modal
  const closeUserModal = document.getElementById('closeUserModal');
  if (closeUserModal) {
    closeUserModal.replaceWith(closeUserModal.cloneNode(true));
    document.getElementById('closeUserModal').addEventListener('click', hideUserModal);
  }
  
  // Password Modal
  const closePasswordModal = document.getElementById('closePasswordModal');
  if (closePasswordModal) {
    closePasswordModal.replaceWith(closePasswordModal.cloneNode(true));
    document.getElementById('closePasswordModal').addEventListener('click', hidePasswordModal);
  }
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    const userModal = document.getElementById('userModal');
    const passwordModal = document.getElementById('passwordModal');
    
    if (e.target === userModal) hideUserModal();
    if (e.target === passwordModal) hidePasswordModal();
  });
}

function setupFormEventListeners() {
  // User Form
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.replaceWith(userForm.cloneNode(true));
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);
  }
  
  // Cancel User button
  const cancelUserBtn = document.getElementById('cancelUserBtn');
  if (cancelUserBtn) {
    cancelUserBtn.addEventListener('click', hideUserModal);
  }
  
  // Password Form
  const passwordChangeForm = document.getElementById('passwordChangeForm');
  if (passwordChangeForm) {
    passwordChangeForm.replaceWith(passwordChangeForm.cloneNode(true));
    document.getElementById('passwordChangeForm').addEventListener('submit', handlePasswordFormSubmit);
  }
  
  // Cancel Password button
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', hidePasswordModal);
  }
  
  // Password toggle buttons
  setupPasswordToggleListeners();
}

function setupPasswordToggleListeners() {
  const toggleButtons = [
    'togglePasswordBtn', 
    'toggleNewPasswordBtn', 
    'toggleConfirmPasswordBtn'
  ];
  
  toggleButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.replaceWith(btn.cloneNode(true));
      document.getElementById(btnId).addEventListener('click', (e) => {
        togglePasswordVisibility(e.target);
      });
    }
  });
}

function setupUserCardListeners() {
  const usersListGrid = document.getElementById('usersListGrid');
  if (usersListGrid) {
    usersListGrid.replaceWith(usersListGrid.cloneNode(true));
    document.getElementById('usersListGrid').addEventListener('click', handleUserCardAction);
  }
}

// Load all users from API
async function loadAllUsers() {
  console.log('📊 Loading all users...');
  showLoader(true);
  
  try {
    console.log(`📡 Fetching from: ${API_BASE_URL}/users`);
    
    // Get current user role for authentication
    const currentUserRole = getCurrentUserRole();
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', userRole: currentUserRole })
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📡 Raw API response:', data);
    
    allUsers = data.roles || [];
    
    console.log(`✅ Loaded ${allUsers.length} users:`, allUsers);
    
    // Update statistics
    updateUserStatistics();
    
    // Display users
    filterUsers('', ''); // Show all users initially
    
  } catch (error) {
    console.error('❌ Error loading users:', error);
    console.error('❌ Error details:', error.stack);
    showNotification('Error loading users: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

// Update user statistics cards
function updateUserStatistics() {
  const totalUsers = allUsers.length;
  const adminUsers = allUsers.filter(u => u.role_name === 'superadmin').length;
  const salesUsers = allUsers.filter(u => u.role_name === 'sales_staff').length;
  const customerUsers = allUsers.filter(u => u.role_name === 'customer').length;
  
  // Update statistics display
  document.getElementById('totalUsersCount').textContent = totalUsers;
  document.getElementById('adminUsersCount').textContent = adminUsers;
  document.getElementById('salesUsersCount').textContent = salesUsers;
  document.getElementById('customerUsersCount').textContent = customerUsers;
}

// Filter users based on search and role filter
function filterUsers(searchTerm, roleFilter) {
  console.log(`🔍 Filtering users. Search: "${searchTerm}", Role: "${roleFilter}"`);
  console.log(`📊 Total users available: ${allUsers.length}`);
  
  filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.role_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.description && user.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = !roleFilter || user.role_name === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  console.log(`📊 Filtered users: ${filteredUsers.length}`, filteredUsers);
  
  renderUsersList();
}

// Render the users list
function renderUsersList() {
  console.log('🎨 Rendering users list...');
  const usersListGrid = document.getElementById('usersListGrid');
  const emptyUsersState = document.getElementById('emptyUsersState');
  
  if (!usersListGrid) {
    console.error('❌ usersListGrid element not found!');
    return;
  }
  
  if (filteredUsers.length === 0) {
    console.log('📊 No filtered users to display - showing empty state');
    usersListGrid.innerHTML = '';
    emptyUsersState.style.display = 'block';
    return;
  }
  
  console.log(`🎨 Rendering ${filteredUsers.length} user cards`);
  emptyUsersState.style.display = 'none';
  
  const usersHTML = filteredUsers.map(user => createUserCard(user)).join('');
  console.log('🎨 Generated HTML length:', usersHTML.length);
  usersListGrid.innerHTML = usersHTML;
  console.log('✅ Users list rendered successfully');
}

// Create a user card HTML
function createUserCard(user) {
  // Parse permissions
  let permissions = [];
  try {
    permissions = typeof user.permissions === 'string' ? 
      JSON.parse(user.permissions) : user.permissions || [];
  } catch (e) {
    console.warn('Failed to parse permissions for user:', user.role_name);
  }
  
  // Get role badge color
  const roleBadgeClass = getRoleBadgeClass(user.role_name);
  
  // Check if user can be deleted (not system roles)
  const canDelete = !['customer', 'sales_staff', 'superadmin'].includes(user.role_name);
  
  return `
    <div class="user-card" data-user-id="${user.id}">
      <div class="user-header">
        <div class="user-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="user-info">
          <h4>${user.role_display_name || user.role_name}</h4>
          <div class="user-role-badge ${roleBadgeClass}">
            <i class="fas ${getRoleIcon(user.role_name)}"></i>
            ${user.role_name}
          </div>
        </div>
      </div>
      
      ${user.description ? `<p class="user-description">${user.description}</p>` : ''}
      
      <div class="user-permissions">
        <h5><i class="fas fa-shield-alt"></i> Permissions</h5>
        <div class="permissions-list">
          ${permissions.slice(0, 4).map(perm => 
            `<span class="permission-badge">${formatPermissionName(perm)}</span>`
          ).join('')}
          ${permissions.length > 4 ? `<span class="permission-badge">+${permissions.length - 4} more</span>` : ''}
        </div>
      </div>
      
      <div class="user-actions">
        <button class="btn-icon btn-edit" data-action="edit" title="Edit User">
          <i class="fas fa-edit"></i>
        </button>
        ${user.requires_password ? `
          <button class="btn-icon btn-password" data-action="password" title="Change Password">
            <i class="fas fa-key"></i>
          </button>
        ` : ''}
        ${canDelete ? `
          <button class="btn-icon btn-delete" data-action="delete" title="Delete User">
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Handle user card actions (edit, delete, password)
function handleUserCardAction(e) {
  const button = e.target.closest('button');
  if (!button) return;
  
  const userCard = button.closest('.user-card');
  const userId = userCard.dataset.userId;
  const action = button.dataset.action;
  const user = allUsers.find(u => u.id == userId);
  
  if (!user) return;
  
  switch (action) {
    case 'edit':
      showUserModal('edit', user);
      break;
    case 'password':
      showPasswordModal(user);
      break;
    case 'delete':
      confirmDeleteUser(user);
      break;
  }
}

// Show user modal (add or edit)
function showUserModal(mode, user = null) {
  const modal = document.getElementById('userModal');
  const title = document.getElementById('userModalTitle');
  const form = document.getElementById('userForm');
  
  currentEditingUser = user;
  
  if (mode === 'add') {
    title.innerHTML = '<i class="fas fa-user-plus"></i> Add New User';
    clearUserForm();
  } else {
    title.innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
    populateUserForm(user);
  }
  
  modal.style.display = 'flex';
  
  // Focus on first input
  setTimeout(() => {
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

// Hide user modal
function hideUserModal() {
  const modal = document.getElementById('userModal');
  modal.style.display = 'none';
  currentEditingUser = null;
  clearUserForm();
}

// Show password modal
function showPasswordModal(user) {
  const modal = document.getElementById('passwordModal');
  const userName = document.getElementById('passwordChangeUserName');
  const userRole = document.getElementById('passwordChangeUserRole');
  const userId = document.getElementById('passwordChangeUserId');
  
  userName.textContent = user.role_display_name || user.role_name;
  userRole.textContent = user.role_name;
  userId.value = user.id;
  
  // Clear password fields
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  
  modal.style.display = 'flex';
}

// Hide password modal
function hidePasswordModal() {
  const modal = document.getElementById('passwordModal');
  modal.style.display = 'none';
}

// Clear user form
function clearUserForm() {
  const form = document.getElementById('userForm');
  form.reset();
  
  // Clear all permission checkboxes
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
}

// Populate user form with existing user data
function populateUserForm(user) {
  document.getElementById('userRoleName').value = user.role_name;
  document.getElementById('userDisplayName').value = user.role_display_name || user.role_name;
  document.getElementById('userDescription').value = user.description || '';
  
  // Don't populate password for existing users
  document.getElementById('userPassword').value = '';
  
  // Set permissions
  let permissions = [];
  try {
    permissions = typeof user.permissions === 'string' ? 
      JSON.parse(user.permissions) : user.permissions || [];
  } catch (e) {
    console.warn('Failed to parse permissions for user:', user.role_name);
  }
  
  const checkboxes = document.querySelectorAll('#userForm input[name="permissions"]');
  checkboxes.forEach(cb => {
    cb.checked = permissions.includes(cb.value);
  });
}

// Handle user form submission
async function handleUserFormSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const userData = {
    role_name: formData.get('roleName').toLowerCase().replace(/\s+/g, '_'),
    role_display_name: formData.get('displayName'),
    description: formData.get('description'),
    password: formData.get('password'),
    permissions: formData.getAll('permissions')
  };
  
  // Validation
  if (!userData.role_name || !userData.role_display_name) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (userData.permissions.length === 0) {
    showNotification('Please select at least one permission', 'error');
    return;
  }
  
  const requiresPassword = userData.permissions.some(p => 
    !['place_orders', 'view_products', 'view_order_status'].includes(p)
  );
  
  if (requiresPassword && !userData.password && !currentEditingUser) {
    showNotification('Password is required for roles with elevated permissions', 'error');
    return;
  }
  
  userData.requires_password = requiresPassword;
  
  try {
    showLoader(true);
    
    let response;
    // Get current user role for authentication
    const currentUserRole = getCurrentUserRole();
    const requestData = { ...userData, userRole: currentUserRole };
    
    if (currentEditingUser) {
      // Update existing user
      response = await fetch(`${API_BASE_URL}/users/${currentEditingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
    } else {
      // Create new user
      response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
    }
    
    const result = await response.json();
    
    if (result.success) {
      const action = currentEditingUser ? 'updated' : 'created';
      showNotification(`User ${action} successfully!`, 'success');
      hideUserModal();
      loadAllUsers(); // Refresh the list
    } else {
      showNotification('Error: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('Error saving user:', error);
    showNotification('Error saving user: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

// Handle password form submission
async function handlePasswordFormSubmit(e) {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const userId = document.getElementById('passwordChangeUserId').value;
  
  if (!newPassword || !confirmPassword) {
    showNotification('Please fill in both password fields', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('Password must be at least 6 characters long', 'error');
    return;
  }
  
  try {
    showLoader(true);
    
    // Get current user role for authentication
    const currentUserRole = getCurrentUserRole();
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword, userRole: currentUserRole })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Password updated successfully!', 'success');
      hidePasswordModal();
    } else {
      showNotification('Error: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('Error changing password:', error);
    showNotification('Error changing password: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

// Confirm delete user
function confirmDeleteUser(user) {
  const message = `Are you sure you want to delete the role "${user.role_display_name}"?\n\nThis action cannot be undone.`;
  
  if (confirm(message)) {
    deleteUser(user.id);
  }
}

// Delete user
async function deleteUser(userId) {
  try {
    showLoader(true);
    
    // Get current user role for authentication
    const currentUserRole = getCurrentUserRole();
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userRole: currentUserRole })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('User deleted successfully!', 'success');
      loadAllUsers(); // Refresh the list
    } else {
      showNotification('Error: ' + result.error, 'error');
    }
    
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Error deleting user: ' + error.message, 'error');
  } finally {
    showLoader(false);
  }
}

// Hide user management and return to admin
function hideUserManagement() {
  console.log('🚪 hideUserManagement() called');
  console.trace('📍 Call stack for hideUserManagement:');
  
  const userManagementSection = document.getElementById('userManagementSection');
  const adminModal = document.getElementById('adminModal');
  const ordersSection = document.getElementById('ordersSection');
  
  if (userManagementSection) {
    userManagementSection.style.display = 'none';
    console.log('🙈 User Management section hidden');
  }
  if (adminModal) {
    adminModal.style.display = 'block';
    console.log('👀 Admin modal shown');
  }
  if (ordersSection) {
    ordersSection.style.display = 'block';
    console.log('👀 Orders section shown');
  }
}

// Toggle password visibility
function togglePasswordVisibility(button) {
  const input = button.parentElement.querySelector('input');
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

// Show/hide loader
function showLoader(show) {
  const loader = document.getElementById('userManagementLoader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${getNotificationColor(type)};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
  
  // Close button handler
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
}

// Utility functions
function getRoleBadgeClass(roleName) {
  switch (roleName) {
    case 'superadmin': return 'role-superadmin';
    case 'sales_staff': return 'role-sales';
    case 'customer': return 'role-customer';
    default: return 'role-custom';
  }
}

function getRoleIcon(roleName) {
  switch (roleName) {
    case 'superadmin': return 'fa-user-shield';
    case 'sales_staff': return 'fa-user-tie';
    case 'customer': return 'fa-user';
    default: return 'fa-user-cog';
  }
}

function formatPermissionName(perm) {
  return perm.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-info-circle';
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    default: return '#3b82f6';
  }
}