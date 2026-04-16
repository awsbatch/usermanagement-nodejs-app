// public/js/app.js
const API = '/api';
let currentUser = null;
let allUsers = [];
let editingUserId = null;

// ================== API HELPERS ==================
async function api(method, path, body) {
  const opts = {
    method, headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ================== AUTH ==================
async function checkAuth() {
  try {
    const data = await api('GET', '/auth/me');
    currentUser = data.user;
    return true;
  } catch { return false; }
}

async function login(email, password) {
  const data = await api('POST', '/auth/login', { email, password });
  currentUser = data.user;
  return data;
}

async function logout() {
  await api('POST', '/auth/logout');
  currentUser = null;
  showPage('login');
}

// ================== PAGES ==================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(name + '-page');
  if (page) page.classList.add('active');
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  const navItem = document.querySelector(`[data-view="${name}"]`);
  if (navItem) navItem.classList.add('active');

  if (name === 'overview') loadOverview();
  if (name === 'users') loadUsers();
  if (name === 'profile') loadProfile();
}

// ================== TOAST ==================
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ================== OVERVIEW ==================
async function loadOverview() {
  try {
    const stats = await api('GET', '/users/stats');
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statActive').textContent = stats.active;
    document.getElementById('statInactive').textContent = stats.inactive;
    document.getElementById('statAdmins').textContent = stats.admins;

    const users = await api('GET', '/users');
    const recent = users.users.slice(-5).reverse();
    const container = document.getElementById('recentUsers');
    container.innerHTML = recent.map(u => `
      <div class="recent-item">
        <div class="avatar-sm">${u.avatar || u.name[0].toUpperCase()}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:0.85rem">${u.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--mono)">${u.email}</div>
        </div>
        <span class="badge badge-${u.role}">${u.role}</span>
        <span class="badge badge-${u.status}">${u.status}</span>
      </div>
    `).join('') || '<div style="color:var(--text-muted);padding:16px">No users yet</div>';
  } catch (e) { toast(e.message, 'error'); }
}

// ================== USERS TABLE ==================
async function loadUsers() {
  try {
    const data = await api('GET', '/users');
    allUsers = data.users;
    renderTable(allUsers);
  } catch (e) { toast(e.message, 'error'); }
}

function renderTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No users found</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="avatar-md">${u.avatar || u.name[0].toUpperCase()}</div>
          <div>
            <div class="user-cell-name">${u.name}</div>
            <div class="user-cell-email">${u.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td><span class="badge badge-${u.status}">${u.status}</span></td>
      <td><span class="date-text">${formatDate(u.createdAt)}</span></td>
      <td>${u.lastLogin ? `<span class="date-text">${formatDate(u.lastLogin)}</span>` : '<span class="never-text">Never</span>'}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="openEditModal('${u._id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${u._id !== currentUser.id ? `
          <button class="btn-icon danger" onclick="openDeleteConfirm('${u._id}', '${u.name}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ================== SEARCH / FILTER ==================
function filterUsers() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const status = document.getElementById('statusFilter').value;

  const filtered = allUsers.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const matchRole = !role || u.role === role;
    const matchStatus = !status || u.status === status;
    return matchSearch && matchRole && matchStatus;
  });
  renderTable(filtered);
}

// ================== MODAL ==================
function openAddModal() {
  editingUserId = null;
  document.getElementById('modalTitle').textContent = 'Add User';
  document.getElementById('modalName').value = '';
  document.getElementById('modalEmail').value = '';
  document.getElementById('modalPassword').value = '';
  document.getElementById('modalRole').value = 'user';
  document.getElementById('modalStatus').value = 'active';
  document.getElementById('passOptional').textContent = '';
  document.getElementById('modalPassword').placeholder = '••••••••';
  document.getElementById('modalError').classList.add('hidden');
  document.getElementById('statusGroup').style.display = 'none';
  document.getElementById('userModal').classList.remove('hidden');
}

function openEditModal(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;
  editingUserId = id;
  document.getElementById('modalTitle').textContent = 'Edit User';
  document.getElementById('modalName').value = user.name;
  document.getElementById('modalEmail').value = user.email;
  document.getElementById('modalPassword').value = '';
  document.getElementById('modalRole').value = user.role;
  document.getElementById('modalStatus').value = user.status;
  document.getElementById('passOptional').textContent = '(leave blank to keep)';
  document.getElementById('modalPassword').placeholder = '••••••••';
  document.getElementById('modalError').classList.add('hidden');
  document.getElementById('statusGroup').style.display = 'block';
  document.getElementById('userModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('userModal').classList.add('hidden');
}

async function saveUser() {
  const name = document.getElementById('modalName').value.trim();
  const email = document.getElementById('modalEmail').value.trim();
  const password = document.getElementById('modalPassword').value;
  const role = document.getElementById('modalRole').value;
  const status = document.getElementById('modalStatus').value;
  const errEl = document.getElementById('modalError');
  errEl.classList.add('hidden');

  if (!name || !email) { errEl.textContent = 'Name and email are required'; errEl.classList.remove('hidden'); return; }
  if (!editingUserId && !password) { errEl.textContent = 'Password is required for new users'; errEl.classList.remove('hidden'); return; }

  try {
    document.getElementById('saveModal').disabled = true;
    if (editingUserId) {
      const updates = { name, email, role, status };
      if (password) updates.password = password;
      await api('PUT', `/users/${editingUserId}`, updates);
      toast('User updated successfully');
    } else {
      await api('POST', '/users', { name, email, password, role });
      toast('User created successfully');
    }
    closeModal();
    loadUsers();
    loadOverview();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  } finally {
    document.getElementById('saveModal').disabled = false;
  }
}

// ================== DELETE CONFIRM ==================
let deleteTargetId = null;

function openDeleteConfirm(id, name) {
  deleteTargetId = id;
  document.getElementById('confirmText').textContent = `Delete "${name}"? This action cannot be undone.`;
  document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirm() {
  deleteTargetId = null;
  document.getElementById('confirmModal').classList.add('hidden');
}

async function executeDelete() {
  if (!deleteTargetId) return;
  try {
    await api('DELETE', `/users/${deleteTargetId}`);
    toast('User deleted');
    closeConfirm();
    loadUsers();
    loadOverview();
  } catch (e) { toast(e.message, 'error'); }
}

// ================== PROFILE ==================
function loadProfile() {
  if (!currentUser) return;
  document.getElementById('profileAvatar').textContent = currentUser.name[0].toUpperCase();
  document.getElementById('profileName').value = currentUser.name;
  document.getElementById('profileEmail').value = currentUser.email;
  document.getElementById('profilePassword').value = '';
  document.getElementById('profileMsg').classList.add('hidden');
}

async function saveProfile() {
  const name = document.getElementById('profileName').value.trim();
  const email = document.getElementById('profileEmail').value.trim();
  const password = document.getElementById('profilePassword').value;
  const msgEl = document.getElementById('profileMsg');
  msgEl.classList.add('hidden');

  try {
    const updates = { name, email };
    if (password) updates.password = password;
    await api('PUT', `/users/${currentUser.id}`, updates);
    msgEl.textContent = 'Profile updated successfully!';
    msgEl.className = 'success-msg';
    msgEl.classList.remove('hidden');
    // Update sidebar
    currentUser.name = name;
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarAvatar').textContent = name[0].toUpperCase();
    toast('Profile saved');
  } catch (e) {
    msgEl.textContent = e.message;
    msgEl.className = 'error-msg';
    msgEl.classList.remove('hidden');
  }
}

// ================== INIT ==================
async function init() {
  const authed = await checkAuth();
  if (authed) {
    showPage('dashboard');
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarRole').textContent = currentUser.role;
    document.getElementById('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();
    // DB badge
    try {
      const info = await fetch('/api/info').then(r => r.json());
      if (info.db === 'mongodb') {
        document.getElementById('dbLabel').textContent = 'MongoDB';
      }
    } catch {}
    showView('overview');
  } else {
    showPage('login');
  }
}

// ================== EVENT LISTENERS ==================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Signing in...';
  try {
    await login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarRole').textContent = currentUser.role;
    document.getElementById('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();
    showPage('dashboard');
    showView('overview');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Sign In';
  }
});

document.getElementById('logoutBtn').addEventListener('click', logout);

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showView(item.dataset.view);
  });
});

document.getElementById('addUserBtn').addEventListener('click', openAddModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('saveModal').addEventListener('click', saveUser);

document.getElementById('confirmClose').addEventListener('click', closeConfirm);
document.getElementById('cancelConfirm').addEventListener('click', closeConfirm);
document.getElementById('confirmDelete').addEventListener('click', executeDelete);

document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

document.getElementById('searchInput').addEventListener('input', filterUsers);
document.getElementById('roleFilter').addEventListener('change', filterUsers);
document.getElementById('statusFilter').addEventListener('change', filterUsers);

// Close modals on overlay click
document.getElementById('userModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('confirmModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeConfirm(); });

init();
