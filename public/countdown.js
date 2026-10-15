/* ═══════════════════════════════════════════════════════════ */
/*  IONE CENTER — Countdown Timer                              */
/* ═══════════════════════════════════════════════════════════ */

// 🎯 تاريخ الإطلاق — غيّره حسب الحاجة
// الصيغة: YYYY-MM-DDTHH:MM:SS+08:00 (توقيت الصين)
const LAUNCH_DATE = new Date('2026-11-15T00:00:00+08:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = LAUNCH_DATE - now;

    // إذا انتهى العد
    if (distance < 0) {
        document.getElementById('countdown').innerHTML = `
            <div style="
                font-size: 2rem;
                font-weight: 800;
                color: var(--ione-red);
                padding: 20px;
            ">
                🎉 الإطلاق الآن!
            </div>
        `;
        return;
    }

    // حساب الأيام والساعات والدقائق والثواني
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // تحديث الأرقام
    updateNumber('days', days);
    updateNumber('hours', hours);
    updateNumber('minutes', minutes);
    updateNumber('seconds', seconds);
}

function updateNumber(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const formattedValue = String(value).padStart(2, '0');
    
    // حركة ناعمة عند التغيير
    if (element.textContent !== formattedValue) {
        element.style.transform = 'scale(1.15)';
        element.style.color = 'var(--ione-red)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 200);
    }
    
    if (element.textContent !== formattedValue) {
        element.textContent = formattedValue;
    }
}

// تشغيل فوري
updateCountdown();

// تحديث كل ثانية
setInterval(updateCountdown, 1000);