/* ═══════════════════════════════════════════════════════════ */
/*  IONE CENTER — Main App Script                              */
/* ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// 1. Email Subscription Form
// ─────────────────────────────────────────────────────────
const form = document.getElementById('subscribeForm');
const emailInput = document.getElementById('emailInput');
const formMessage = document.getElementById('formMessage');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // التحقق من البريد
        if (!isValidEmail(email)) {
            showMessage('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return;
        }
        
        // تعطيل الزر أثناء الإرسال
        const btn = form.querySelector('button');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '⏳ جاري...';
        
        try {
            // إرسال إلى الـ API
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email,
                    timestamp: new Date().toISOString(),
                    page: 'coming-soon'
                })
            });
            
            if (response.ok) {
                showMessage('✅ شكراً! سنُخبرك عند الإطلاق', 'success');
                emailInput.value = '';
            } else {
                throw new Error('فشل الإرسال');
            }
        } catch (error) {
            console.debug('API not available, saving locally:', error.message);
            
            // حفظ محلياً كاحتياطي
            saveToLocalStorage(email);
            showMessage('✅ شكراً! سنُخبرك عند الإطلاق', 'success');
            emailInput.value = '';
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (window.lucide) lucide.createIcons();
        }
    });
}

// ─────────────────────────────────────────────────────────
// 2. Helpers
// ─────────────────────────────────────────────────────────
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showMessage(text, type) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    
    setTimeout(() => {
        formMessage.className = 'form-message';
    }, 5000);
}

function saveToLocalStorage(email) {
    try {
        const emails = JSON.parse(localStorage.getItem('ione_emails') || '[]');
        emails.push({
            email,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ione_emails', JSON.stringify(emails));
    } catch (e) {
        console.error('LocalStorage error:', e);
    }
}

// ─────────────────────────────────────────────────────────
// 3. Log Visit (Analytics)
// ─────────────────────────────────────────────────────────
async function logVisit() {
    try {
        await fetch('/api/log-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                page: 'coming-soon',
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent,
                language: navigator.language,
                screen: `${screen.width}x${screen.height}`
            })
        });
    } catch (error) {
        console.debug('Visit log skipped (local dev)');
    }
}

// تسجيل الزيارة بعد 2 ثواني (لا نُبطئ التحميل)
setTimeout(logVisit, 2000);

// ─────────────────────────────────────────────────────────
// 4. Smooth Scroll on Focus
// ─────────────────────────────────────────────────────────
if (emailInput) {
    emailInput.addEventListener('focus', () => {
        setTimeout(() => {
            emailInput.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    });
}

// ─────────────────────────────────────────────────────────
// 5. Console Branding
// ─────────────────────────────────────────────────────────
console.log(
    '%c IONE CENTER ',
    'background: #E31E24; color: white; font-size: 20px; font-weight: bold; padding: 8px 16px; border-radius: 4px;'
);
console.log(
    '%c Coming Soon — 2026 ',
    'color: #6e6e73; font-size: 12px; padding: 4px;'
);