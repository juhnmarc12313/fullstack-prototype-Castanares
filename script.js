// STEP 1: SETUP VARIABLES

// This stores the current logged-in user (null = not logged in)
let currentUser = null;

// This is the key we use to save data in localStorage
const STORAGE_KEY = "ipt_demo_v1";

// This is our "database" - stored in browser's localStorage
window.db = {};

// STEP 2: LOAD DATA FROM STORAGE

// This runs when the page loads
// It loads saved data or creates default data
function loadFromStorage() {
  // Try to get saved data from localStorage
  const rawData = localStorage.getItem(STORAGE_KEY);
  
  if (rawData) {
    // If data exists, parse it from JSON string to object
    window.db = JSON.parse(rawData);
  } else {
    // If no data exists, create default data
    window.db = {
      // Default admin account
      accounts: [
        {
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          password: "Password123!",
          role: "admin",
          verified: true
        }
      ],
      // Default departments
      departments: [
        { id: 1, name: "Engineering", description: "Software development team" },
        { id: 2, name: "HR", description: "Human resources team" }
      ],
      // Empty lists for employees and requests
      employees: [],
      requests: []
    };
    // Save the default data
    saveToStorage();
  }
}

// STEP 3: SAVE DATA TO STORAGE

// This saves our database to localStorage
function saveToStorage() {
  // Convert object to JSON string and save
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// STEP 4: NAVIGATION (ROUTING)

// Change the URL hash to navigate to a page
function navigateTo(hash) {
  window.location.hash = hash;
}

// This function runs when URL hash changes
// It shows/hides pages based on the URL
function handleRouting() {
  // Get the current hash (default to "#/" if none)
  let hash = window.location.hash || "#/";
  
  // Hide all pages first
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  // Convert hash to page ID
  // Example: "#/login" becomes "login-page"
  const pageName = hash.replace("#/", "");
  const pageId = pageName + "-page";
  
  // Find the page element
  let page = document.getElementById(pageId);
  
  // If page not found, show home page
  if (!page) {
    page = document.getElementById("home-page");
  }
  
  // Handle verified message on login page
  // Only show if user just completed verification (not after logout)
  if (pageName === "login") {
    const verifiedMessage = document.getElementById("verified-message");
    if (verifiedMessage) {
      if (sessionStorage.getItem("justVerified") === "true") {
        verifiedMessage.style.display = "block";
      } else {
        verifiedMessage.style.display = "none";
      }
    }
  }

  // for profile page - call renderProfile when navigating to #/profile
  if (pageName === "profile") {
    renderProfile();
  }

  // Call render functions for admin pages
  if (pageName === "account") {
    renderAccountsList();
  }
  if (pageName === "department") {
    renderDepartmentsTable();
  }
  if (pageName === "employee") {
    renderEmployeesTable();
  }
  if (pageName === "request") {
    renderUserRequests();
  }


  // SECURITY: Check if user needs to be logged in
  const protectedPages = ["profile", "account", "employee", "department", "requests"];
  
  if (!currentUser && protectedPages.includes(pageName)) {
    // Not logged in - redirect to login
    navigateTo("#/login");
    return;
  }

  // SECURITY: Check if user needs admin role
  const adminOnlyPages = ["account", "employee", "department"];
  
  if (currentUser && currentUser.role !== "admin" && adminOnlyPages.includes(pageName)) {
    // Not admin - redirect to home
    navigateTo("#/");
    return;
  }

  // Show the page
  page.classList.add("active");
}

// Listen for URL hash changes
window.addEventListener("hashchange", handleRouting);

// STEP 5: AUTHENTICATION STATE

// This updates the UI based on login state
function setAuthState(isLoggedIn, user = null) {
  // Store the current user
  currentUser = user;

  // Update body classes for CSS styling
  document.body.classList.toggle("authenticated", isLoggedIn);
  document.body.classList.toggle("not-authenticated", !isLoggedIn);

  // Add admin class if user is admin
  if (user && user.role === "admin") {
    document.body.classList.add("is-admin");
  } else {
    document.body.classList.remove("is-admin");
  }

  // Update navigation to show username
  const navUsername = document.getElementById("nav-username");
  if (navUsername && user) {
    navUsername.innerText = user.firstName;
  }
}

// STEP 6: LOGIN FUNCTION

function handleLogin() {
  // Get input values
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  // Validate inputs
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // Find user in our database
  const user = window.db.accounts.find(account => 
    account.email === email && 
    account.password === password &&
    account.verified === true
  );

  if (user) {
    // Login successful!
    // Clear the verification flag after successful login
    sessionStorage.removeItem("justVerified");
    
    // Save a fake "auth token" (just the email)
    localStorage.setItem("auth_token", user.email);
    
    // Update the UI state
    setAuthState(true, user);
    
    // Navigate to profile page
    navigateTo("#/profile");
    
    alert("Login successful! Welcome, " + user.firstName);
  } else {
    // Login failed
    alert("Invalid email or password, or account not verified");
  }
}

// STEP 7: REGISTER FUNCTION

function handleRegister() {
  // Get input values
  const firstName = document.getElementById("reg-firstname").value;
  const lastName = document.getElementById("reg-lastname").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  // Validate inputs
  if (!firstName || !lastName || !email || !password) {
    alert("Please fill in all fields");
    return;
  }

  // Check if email already exists
  const existingUser = window.db.accounts.find(account => 
    account.email === email
  );

  if (existingUser) {
    alert("Email already registered");
    return;
  }

  // Create new user
  const newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    role: "user", // Default role is "user"
    verified: false // Needs verification
  };

  // Add to database
  window.db.accounts.push(newUser);
  saveToStorage();

  // Show verification page
  alert("Registration successful! Please verify your email.");
  navigateTo("#/verify");
}

// STEP 8: EMAIL VERIFICATION FUNCTION

function handleVerify() {
  // In a real app, this would check a verification code
  // For this demo, we just mark the user as verified
  
  // Get the last registered user
  const lastUser = window.db.accounts[window.db.accounts.length - 1];
  
  if (lastUser) {
    lastUser.verified = true;
    saveToStorage();
    
    // Set flag to show verified message on login page (only once)
    sessionStorage.setItem("justVerified", "true");
    
    alert("Email verified! You can now login.");
    navigateTo("#/login");
  }
}

// STEP 9: LOGOUT FUNCTION

function handleLogout() {
  // Clear the auth token
  localStorage.removeItem("auth_token");
  
  // Clear the verification flag
  sessionStorage.removeItem("justVerified");
  
  // Reset the UI state
  setAuthState(false, null);
  
  // Navigate to home
  navigateTo("#/");
  
  alert("You have been logged out");
}

// STEP 10: PAGE INITIALIZATION

// This runs when the page finishes loading
document.addEventListener("DOMContentLoaded", function() {
  // Load data from storage
  loadFromStorage();
  
  // Check if user is already logged in (has auth token)
  const savedToken = localStorage.getItem("auth_token");
  if (savedToken) {
    // Find the user by email
    const user = window.db.accounts.find(account => 
      account.email === savedToken
    );
    if (user) {
      setAuthState(true, user);
    }
  }
  
  // Setup routing
  handleRouting();
  
  // Add click handlers to buttons
  setupButtonHandlers();
  
  // Initialize request form when modal opens
  const requestModal = document.getElementById("requestModal");
  if (requestModal) {
    requestModal.addEventListener("show.bs.modal", initRequestForm);
  }
});

// STEP 11: BUTTON HANDLERS

function setupButtonHandlers() {
  // Get Started button - goes to register page
  const getStartedBtn = document.querySelector(".getstarted-btn");
  if (getStartedBtn) {
    getStartedBtn.onclick = function() {
      navigateTo("#/register");
    };
  }

  // Login button
  const loginBtn = document.querySelector("#login-page .btn-primary");
  if (loginBtn) {
    loginBtn.onclick = handleLogin;
  }

  // Register button
  const registerBtn = document.querySelector("#register-page .btn-success");
  if (registerBtn) {
    registerBtn.onclick = handleRegister;
  }

  // Verify button
  const verifyBtn = document.querySelector("#verify-page .btn-success");
  if (verifyBtn) {
    verifyBtn.onclick = handleVerify;
  }

  // Logout link in dropdown
  const logoutLink = document.querySelector(".dropdown-item[href='#logout']");
  if (logoutLink) {
    logoutLink.onclick = function(e) {
      e.preventDefault();
      handleLogout();
    };
  }

  // Navigation links
  setupNavigationLinks();
}

// STEP 12: NAVIGATION LINKS

function setupNavigationLinks() {
  // Login link in nav
  const loginLink = document.querySelector('.links a[href="#login"]');
  if (loginLink) {
    loginLink.onclick = function(e) {
      e.preventDefault();
      navigateTo("#/login");
    };
  }

  // Register link in nav
  const registerLink = document.querySelector('.links a[href="#register"]');
  if (registerLink) {
    registerLink.onclick = function(e) {
      e.preventDefault();
      navigateTo("#/register");
    };
  }

  // Dropdown menu links
  const dropdownLinks = document.querySelectorAll(".dropdown-item");
  dropdownLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#") && href !== "#logout") {
      link.onclick = function(e) {
        e.preventDefault();
        const page = href.replace("#", "");
        navigateTo("#/" + page);
      };
    }
  });
}

// HELPER FUNCTIONS (can be called from HTML onclick)

// Go to register page - can be used with onclick="goToRegister()"
function goToRegister() {
  navigateTo("#/register");
}
// Go to login page - can be used with onclick="goToLogin()"
function goToLogin() {
  navigateTo("#/login");
}


// Phase 5: renderProfile() function - displays user's name, email, role
function renderProfile() {
  if (!currentUser) return;
  
  document.getElementById("profile-name").innerText = 
    currentUser.firstName + " " + currentUser.lastName;
  document.getElementById("profile-email").innerText = currentUser.email;
  document.getElementById("profile-role").innerText = currentUser.role;
}

// Show edit mode (Phase 5: just show alert for now)
function showEditProfile() {
  alert("Edit Profile feature coming soon!");
}

// ============================================
// PHASE 6: ADMIN FEATURES (CRUD)
// ============================================

// --- ACCOUNTS ---

// Track which account is being edited
let editingAccountId = null;

function renderAccountsList() {
  const tbody = document.querySelector("#account-page tbody");
  if (!tbody) return;
  
  let html = "";
  window.db.accounts.forEach((acc, index) => {
    html += `
      <tr>
        <td>${acc.firstName} ${acc.lastName}</td>
        <td>${acc.email}</td>
        <td>${acc.role}</td>
        <td>${acc.verified ? "✅" : "—"}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="editAccount(${index})">Edit</button>
          <button class="btn btn-outline-warning btn-sm" onclick="resetPassword(${index})">Reset PW</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteAccount(${index})">Delete</button>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

function openAddAccountForm() {
  editingAccountId = null;
  document.querySelector("#account-page input[id='firstname']").value = "";
  document.querySelector("#account-page input[id='lastname']").value = "";
  document.querySelector("#account-page input[id='email']").value = "";
  document.querySelector("#account-page input[id='password']").value = "";
  document.querySelector("#account-page input[id='role']").value = "user";
  document.querySelector("#account-page input[id='verified']").checked = false;
  document.querySelector(".Ad-edit").style.display = "block";
}

function editAccount(index) {
  const acc = window.db.accounts[index];
  editingAccountId = index;
  document.querySelector("#account-page input[id='firstname']").value = acc.firstName;
  document.querySelector("#account-page input[id='lastname']").value = acc.lastName;
  document.querySelector("#account-page input[id='email']").value = acc.email;
  document.querySelector("#account-page input[id='password']").value = acc.password;
  document.querySelector("#account-page input[id='role']").value = acc.role;
  document.querySelector("#account-page input[id='verified']").checked = acc.verified;
  document.querySelector(".Ad-edit").style.display = "block";
}

function saveAccount() {
  const firstName = document.querySelector("#account-page input[id='firstname']").value.trim();
  const lastName = document.querySelector("#account-page input[id='lastname']").value.trim();
  const email = document.querySelector("#account-page input[id='email']").value.trim();
  const password = document.querySelector("#account-page input[id='password']").value;
  const role = document.querySelector("#account-page input[id='role']").value.trim() || "user";
  const verified = document.querySelector("#account-page input[id='verified']").checked;
  
  if (!firstName || !lastName || !email || !password) {
    alert("Please fill in all fields");
    return;
  }
  
  if (editingAccountId !== null) {
    // Update existing
    window.db.accounts[editingAccountId] = { firstName, lastName, email, password, role, verified };
  } else {
    // Check for duplicate email
    if (window.db.accounts.some(a => a.email === email)) {
      alert("Email already exists");
      return;
    }
    window.db.accounts.push({ firstName, lastName, email, password, role, verified });
  }
  
  saveToStorage();
  renderAccountsList();
  cancelAccountForm();
  alert("Account saved!");
}

function cancelAccountForm() {
  document.querySelector(".Ad-edit").style.display = "none";
  editingAccountId = null;
}

function resetPassword(index) {
  const acc = window.db.accounts[index];
  const newPW = prompt(`Enter new password for ${acc.email} (min 6 chars):`);
  if (newPW && newPW.length >= 6) {
    window.db.accounts[index].password = newPW;
    saveToStorage();
    alert("Password reset successfully!");
  } else if (newPW) {
    alert("Password must be at least 6 characters");
  }
}

function deleteAccount(index) {
  const acc = window.db.accounts[index];
  if (acc.email === currentUser.email) {
    alert("Cannot delete your own account!");
    return;
  }
  if (confirm(`Delete account ${acc.email}?`)) {
    window.db.accounts.splice(index, 1);
    saveToStorage();
    renderAccountsList();
    alert("Account deleted!");
  }
}

// --- DEPARTMENTS ---

function renderDepartmentsTable() {
  const tbody = document.querySelector("#department-page tbody");
  if (!tbody) return;
  
  let html = "";
  window.db.departments.forEach((dept, index) => {
    html += `
      <tr>
        <td>${dept.name}</td>
        <td>${dept.description}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="editDepartment(${dept.id})">Edit</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteDepartment(${dept.id})">Delete</button>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

function addDepartment() {
  alert("Add Department feature coming soon!");
}

function editDepartment(id) {
  alert("Edit Department feature coming soon!");
}

function deleteDepartment(id) {
  if (confirm("Delete this department?")) {
    window.db.departments = window.db.departments.filter(d => d.id !== id);
    saveToStorage();
    renderDepartmentsTable();
    alert("Department deleted!");
  }
}

// --- EMPLOYEES ---

let editingEmployeeId = null;

function renderEmployeesTable() {
  const tbody = document.querySelector("#employee-page tbody");
  if (!tbody) return;
  
  let html = "";
  window.db.employees.forEach((emp, index) => {
    const dept = window.db.departments.find(d => d.id === emp.deptId);
    html += `
      <tr>
        <td>${emp.id}</td>
        <td>${emp.userEmail}</td>
        <td>${emp.position}</td>
        <td>${dept ? dept.name : "—"}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="editEmployee(${index})">Edit</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteEmployee(${index})">Delete</button>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

function openAddEmployeeForm() {
  editingEmployeeId = null;
  const form = document.querySelector("#add-edit-page");
  form.querySelector('input[id="firstname"]').value = "";
  form.querySelector('input[id="email"]').value = "";
  form.querySelector('input[id="position"]').value = "";
  form.querySelector('input[id="department"]').value = "";
  form.querySelector('input[id="date"]').value = "";
  form.style.display = "block";
  
  // Populate department dropdown
  populateDeptDropdown();
}

function populateDeptDropdown() {
  const deptInput = document.querySelector('#add-edit-page input[id="department"]');
  if (!deptInput) return;
  
  // Replace input with select
  const select = document.createElement("select");
  select.className = "form-select";
  select.id = "employee-dept";
  select.innerHTML = '<option value="">Select Department</option>';
  window.db.departments.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
  });
  deptInput.replaceWith(select);
}

function editEmployee(index) {
  const emp = window.db.employees[index];
  editingEmployeeId = index;
  
  const form = document.querySelector("#add-edit-page");
  form.querySelector('input[id="firstname"]').value = emp.id;
  form.querySelector('input[id="email"]').value = emp.userEmail;
  form.querySelector('input[id="position"]').value = emp.position;
  form.querySelector('input[id="date"]').value = emp.hireDate || "";
  
  populateDeptDropdown();
  form.querySelector('#employee-dept').value = emp.deptId || "";
  form.style.display = "block";
}

function saveEmployee() {
  const form = document.querySelector("#add-edit-page");
  const id = form.querySelector('input[id="firstname"]').value.trim();
  const userEmail = form.querySelector('input[id="email"]').value.trim();
  const position = form.querySelector('input[id="position"]').value.trim();
  const deptId = parseInt(form.querySelector('#employee-dept')?.value) || null;
  const hireDate = form.querySelector('input[id="date"]').value;
  
  if (!id || !userEmail || !position) {
    alert("Please fill in Employee ID, Email, and Position");
    return;
  }
  
  // Validate email exists in accounts
  const account = window.db.accounts.find(a => a.email === userEmail);
  if (!account) {
    alert("Email must match an existing account");
    return;
  }
  
  if (editingEmployeeId !== null) {
    window.db.employees[editingEmployeeId] = { id, userEmail, position, deptId, hireDate };
  } else {
    window.db.employees.push({ id, userEmail, position, deptId, hireDate });
  }
  
  saveToStorage();
  renderEmployeesTable();
  cancelEmployeeForm();
  alert("Employee saved!");
}

function cancelEmployeeForm() {
  document.querySelector("#add-edit-page").style.display = "none";
  editingEmployeeId = null;
}

function deleteEmployee(index) {
  if (confirm("Delete this employee?")) {
    window.db.employees.splice(index, 1);
    saveToStorage();
    renderEmployeesTable();
    alert("Employee deleted!");
  }
}

// ============================================
// PHASE 7: USER REQUESTS
// ============================================

// Render requests for current user only
function renderUserRequests() {
  if (!currentUser) return;
  
  const tbody = document.querySelector("#requests-table tbody");
  const noRequestsMsg = document.getElementById("no-requests-msg");
  
  if (!tbody) return;
  
  // Filter requests by current user's email
  const userRequests = window.db.requests.filter(
    req => req.employeeEmail === currentUser.email
  );
  
  if (userRequests.length === 0) {
    tbody.innerHTML = "";
    if (noRequestsMsg) noRequestsMsg.style.display = "block";
    return;
  }
  
  if (noRequestsMsg) noRequestsMsg.style.display = "none";
  
  let html = "";
  userRequests.forEach(req => {
    // Status badge styling
    let statusBadge = "";
    if (req.status === "Pending") {
      statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
    } else if (req.status === "Approved") {
      statusBadge = '<span class="badge bg-success">Approved</span>';
    } else if (req.status === "Rejected") {
      statusBadge = '<span class="badge bg-danger">Rejected</span>';
    }
    
    // Format items for display
    const itemsDisplay = req.items.map(item => `${item.name} (${item.qty})`).join(", ");
    
    html += `
      <tr>
        <td>${req.date}</td>
        <td>${req.type}</td>
        <td>${itemsDisplay}</td>
        <td>${statusBadge}</td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

// Add a new item row in the modal
function addItemRow() {
  const container = document.getElementById("items-container");
  const newRow = document.createElement("div");
  newRow.className = "input-group mb-2";
  newRow.innerHTML = `
    <input type="text" class="form-control item-name" placeholder="Item name" />
    <input type="number" class="form-control item-qty" value="1" min="1" style="max-width: 80px" />
    <button class="btn btn-outline-danger" type="button" onclick="removeItemRow(this)">×</button>
  `;
  container.appendChild(newRow);
}

// Remove an item row
function removeItemRow(button) {
  const container = document.getElementById("items-container");
  const rows = container.querySelectorAll(".input-group");
  
  // Don't remove if it's the only row
  if (rows.length > 1) {
    button.closest(".input-group").remove();
  } else {
    alert("You need at least one item");
  }
}

// Submit the request
function submitRequest() {
  const type = document.getElementById("request-type").value;
  const itemRows = document.querySelectorAll("#items-container .input-group");
  
  // Collect items
  const items = [];
  itemRows.forEach(row => {
    const name = row.querySelector(".item-name").value.trim();
    const qty = parseInt(row.querySelector(".item-qty").value) || 1;
    if (name) {
      items.push({ name, qty });
    }
  });
  
  // Validate at least one item
  if (items.length === 0) {
    alert("Please add at least one item");
    return;
  }
  
  // Create request object
  const newRequest = {
    type: type,
    items: items,
    status: "Pending",
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    employeeEmail: currentUser.email
  };
  
  // Save to database
  window.db.requests.push(newRequest);
  saveToStorage();
  
  // Close modal (using Bootstrap)
  const modalEl = document.getElementById("requestModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
  
  // Clear form for next use
  clearRequestForm();
  
  // Re-render the table
  renderUserRequests();
  
  alert("Request submitted successfully!");
}

// Clear the request form
function clearRequestForm() {
  document.getElementById("request-type").value = "Equipment";
  const container = document.getElementById("items-container");
  container.innerHTML = "";
  // Add one empty row
  addItemRow();
}

// Initialize request form when modal opens
function initRequestForm() {
  clearRequestForm();
}
