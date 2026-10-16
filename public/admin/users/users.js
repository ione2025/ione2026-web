/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Users Management Script                       */
/* ═══════════════════════════════════════════════════════════ */

// Config
const API_BASE = 'https://ionecenter.com';
const TOKEN_KEY = 'ione_admin_token';

// State
let allUsers = [];

// ─────────────────────────────────────────────────────────────
// Initialize
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    // Check auth
    if (!isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }
    
    loadUsers();
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
    
    // Role filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }
});

// ─────────────────────────────────────────────────────────────
// Load Users
// ─────────────────────────────────────────────────────────────
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    
    try {
        const token = getToken();
        
        if (!token) {
            window.location.href = '../login.html';
            return;
        }
        
        const response = await fetch(`${API_BASE}/users/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            if (response.status === 401) {
                // Token expired
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = '../login.html';
                return;
            }
            
            showError(data.error || 'فشل تحميل المستخدمين');
            return;
        }
        
        allUsers = data.users;
        renderUsers(allUsers);
        
    } catch (error) {
        console.error('Error:', error);
        showError('خطأ في الاتصال بالسيرفر');
    }
}

// ─────────────────────────────────────────────────────────────
// Render Users
// ─────────────────────────────────────────────────────────────
function renderUsers(users) {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="users-empty">
                <i data-lucide="users"></i>
                <h3>لا يوجد مستخدمون</h3>
                <p>ابدأ بإضافة مستخدم جديد</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    const roleLabels = {
        'ceo': 'CEO',
        'manager': 'مدير',
        'operator': 'موظف',
        'viewer': 'مشاهد'
    };
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>المستخدم</th>
                    <th>الدور</th>
                    <th>الصلاحيات</th>
                    <th>الحالة</th>
                    <th>آخر دخول</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar">${user.username[0]}</div>
                                <div class="user-info">
                                    <span class="user-name">${user.full_name || user.username}</span>
                                    <span class="user-email">${user.email}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="role-badge role-${user.role}">
                                ${roleLabels[user.role] || user.role}
                            </span>
                        </td>
                        <td>
                            <span style="color: var(--text-secondary); font-size: 0.85rem;">
                                ${user.permissions.includes('*') ? 'كل الصلاحيات' : 
                                  user.permissions.length + ' صلاحية'}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.active ? 'status-active' : 'status-inactive'}">
                                ${user.active ? 'نشط' : 'معطّل'}
                            </span>
                        </td>
                        <td style="color: var(--text-secondary); font-size: 0.85rem;">
                            ${user.last_login ? new Date(user.last_login).toLocaleDateString('ar-EG') : 'لم يدخل بعد'}
                        </td>
                        <td>
                            <div class="user-actions">
                                <a href="edit.html?email=${encodeURIComponent(user.email)}" class="action-icon-btn edit" title="تعديل">
                                    <i data-lucide="edit-3"></i>
                                </a>
                                <button class="action-icon-btn delete" onclick="deleteUser('${user.email}')" title="حذف">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    if (window.lucide) lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────
// Filter Users
// ─────────────────────────────────────────────────────────────
function filterUsers() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';
    
    let filtered = allUsers;
    
    if (searchTerm) {
        filtered = filtered.filter(u => 
            u.email.toLowerCase().includes(searchTerm) ||
            (u.full_name || '').toLowerCase().includes(searchTerm) ||
            u.username.toLowerCase().includes(searchTerm)
        );
    }
    
    if (roleFilter !== 'all') {
        filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    renderUsers(filtered);
}

// ─────────────────────────────────────────────────────────────
// Delete User
// ─────────────────────────────────────────────────────────────
async function deleteUser(email) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم؟\n\n${email}`)) {
        return;
    }
    
    try {
        const token = getToken();
        
        const response = await fetch(`${API_BASE}/users/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert('فشل الحذف: ' + (data.error || 'خطأ'));
            return;
        }
        
        showToast('تم حذف المستخدم', 'success');
        loadUsers();
        
    } catch (error) {
        console.error('Error:', error);
        alert('خطأ في الاتصال');
    }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function showError(message) {
    const container = document.getElementById('usersContainer');
    if (container) {
        container.innerHTML = `
            <div class="users-empty">
                <i data-lucide="alert-circle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

function showToast(message, type = 'info') {
    const colors = {
        info: '#0071e3',
        success: '#34C759',
        warning: '#FF9F0A',
        error: '#FF3B30'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: ${colors[type]};
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 10000;
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}