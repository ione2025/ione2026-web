/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Admin Panel Scripts                           */
/*  Version: 1.0.0                                             */
/* ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// 🔐 Admin Password (سنُغيّرها لاحقاً إلى API)
// ─────────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'ione2026admin';
const SESSION_KEY = 'ione_admin_session';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // ساعتان

// ─────────────────────────────────────────────────────────
// 🔐 Login Page Logic
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const formMessage = document.getElementById('formMessage');
    const togglePassword = document.getElementById('togglePassword');
    
    // إذا لم نكن في صفحة login — تجاهل
    if (!loginForm) return;
    
    // ✅ إذا كان الأدمن مسجلاً بالفعل → انتقل للوحة
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // ───────────────────────────────────────────────────
    // 👁️ Toggle Password Visibility
    // ───────────────────────────────────────────────────
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // تغيير الأيقونة
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
                if (window.lucide) lucide.createIcons();
            }
        });
    }
    
    // ───────────────────────────────────────────────────
    // 📝 Login Form Submit
    // ───────────────────────────────────────────────────
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = passwordInput.value.trim();
        
        // تحقق
        if (!password) {
            showMessage('يرجى إدخال كلمة المرور', 'error');
            return;
        }
        
        // حالة تحميل
        setLoading(true);
        showMessage('جاري التحقق...', '');
        
        // تأخير وهمي (لتجربة أفضل)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 🔐 التحقق من كلمة المرور
        if (password === ADMIN_PASSWORD) {
            // ✅ نجح
            showMessage('✅ مرحباً! جاري التحويل...', 'success');
            
            // حفظ الجلسة
            saveSession();
            
            // انتقل للوحة بعد 1 ثانية
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            // ❌ فشل
            showMessage('❌ كلمة المرور غير صحيحة', 'error');
            setLoading(false);
            
            // اهتزاز الحقل
            passwordInput.style.animation = 'shake 0.4s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 400);
            
            // تفريغ الحقل
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
    
    // ───────────────────────────────────────────────────
    // 🔧 Helper Functions
    // ───────────────────────────────────────────────────
    function showMessage(text, type) {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.className = 'form-message' + (type ? ' ' + type : '');
    }
    
    function setLoading(loading) {
        if (!loginBtn) return;
        
        if (loading) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span>⏳ جاري التحقق...</span>';
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i data-lucide="log-in"></i><span>تسجيل الدخول</span>';
            if (window.lucide) lucide.createIcons();
        }
    }
});

// ─────────────────────────────────────────────────────────
// 🔐 Session Management
// ─────────────────────────────────────────────────────────
function saveSession() {
    const session = {
        loggedIn: true,
        loginTime: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
    };
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
        console.error('Session save error:', e);
    }
}

function isLoggedIn() {
    try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (!sessionData) return false;
        
        const session = JSON.parse(sessionData);
        
        // تحقق من الانتهاء
        if (Date.now() > session.expiresAt) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        
        return session.loggedIn === true;
    } catch (e) {
        return false;
    }
}

function logout() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error('Logout error:', e);
    }
    window.location.href = 'login.html';
}

// ─────────────────────────────────────────────────────────
// 🌐 Global Error Handler
// ─────────────────────────────────────────────────────────
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// ─────────────────────────────────────────────────────────
// 📊 Console Branding
// ─────────────────────────────────────────────────────────
console.log(
    '%c IONECENTER Admin ',
    'background: #E31E24; color: white; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
);
console.log(
    '%c v1.0.0 — ' + new Date().toLocaleString('ar-EG'),
    'color: #6e6e73; font-size: 11px; padding: 2px;'
);