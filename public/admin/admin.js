/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Admin Core Script v2.0                        */
/*  Authentication + Permissions + Utilities                   */
/* ═══════════════════════════════════════════════════════════ */

const TOKEN_KEY = 'ione_admin_token';
const USER_KEY = 'ione_admin_user';
const API_BASE = 'https://ionecenter.com';

// ─────────────────────────────────────────────────────────────
// 🔐 Session Management
// ─────────────────────────────────────────────────────────────

function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    try {
        const userRaw = localStorage.getItem(USER_KEY);
        return userRaw ? JSON.parse(userRaw) : null;
    } catch (e) {
        return null;
    }
}

function isLoggedIn() {
    return !!(getToken() && getCurrentUser());
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
}

// ─────────────────────────────────────────────────────────────
// 🛡️ Permissions
// ─────────────────────────────────────────────────────────────

function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.permissions && user.permissions.includes('*')) return true;
    return user.permissions && user.permissions.includes(permission);
}

function isCEO() {
    const user = getCurrentUser();
    return user && (user.role === 'ceo' || (user.permissions && user.permissions.includes('*')));
}

// ─────────────────────────────────────────────────────────────
// 🌐 API Helper
// ─────────────────────────────────────────────────────────────

async function apiCall(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }
    
    return response;
}

// ─────────────────────────────────────────────────────────────
// 🎬 Auto-Protect Pages
// ─────────────────────────────────────────────────────────────

(function autoProtect() {
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || 
                        path.endsWith('/admin/') ||
                        path.endsWith('/admin') ||
                        path === '/' ||
                        path.endsWith('/index.html');
    
    if (!isLoginPage && !isLoggedIn()) {
        window.location.href = 'login.html';
    }
})();

// ─────────────────────────────────────────────────────────────
// 🍞 Toast Notification
// ─────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
    const colors = {
        info: '#0071e3',
        success: '#34C759',
        warning: '#FF9F0A',
        error: '#FF3B30'
    };
    
    let container = document.getElementById('ione-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ione-toast-container';
        container.style.cssText = `
            position: fixed; bottom: 24px; left: 50%;
            transform: translateX(-50%); z-index: 10000;
            display: flex; flex-direction: column; gap: 8px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type]}; color: white;
        padding: 14px 24px; border-radius: 12px;
        font-family: 'Cairo', sans-serif; font-weight: 600;
        font-size: 0.95rem; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        transform: translateY(100px); opacity: 0;
        transition: all 0.3s ease;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─────────────────────────────────────────────────────────────
// 🎬 Console Branding
// ─────────────────────────────────────────────────────────────

console.log(
    '%c IONECENTER Admin v2.0 ',
    'background: #E31E24; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
);

// ─────────────────────────────────────────────────────────────
// 🌐 Global Exports
// ─────────────────────────────────────────────────────────────

window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.getToken = getToken;
window.logout = logout;
window.saveSession = saveSession;
window.hasPermission = hasPermission;
window.isCEO = isCEO;
window.apiCall = apiCall;
window.showToast = showToast;