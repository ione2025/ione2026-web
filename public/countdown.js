/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Countdown Timer with Drop Animation           */
/*  Version: 2.0 — Animated Digits                             */
/* ═══════════════════════════════════════════════════════════ */

// 🎯 تاريخ الإطلاق
const LAUNCH_DATE = new Date('2026-11-15T00:00:00+08:00').getTime();

// Store previous values to detect changes
const previousValues = {
    days: null,
    hours: null,
    minutes: null,
    seconds: null
};

function updateCountdown() {
    const now = new Date().getTime();
    const distance = LAUNCH_DATE - now;

    if (distance < 0) {
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.innerHTML = `
                <div style="
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--ione-red);
                    padding: 20px;
                    text-align: center;
                    width: 100%;
                ">
                    🎉 الإطلاق الآن!
                </div>
            `;
        }
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    updateDigit('days', days);
    updateDigit('hours', hours);
    updateDigit('minutes', minutes);
    updateDigit('seconds', seconds);
}

function updateDigit(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const formattedValue = String(value).padStart(2, '0');

    // Only animate if value changed
    if (previousValues[elementId] === formattedValue) return;

    // Skip animation on first load
    if (previousValues[elementId] === null) {
        element.textContent = formattedValue;
        previousValues[elementId] = formattedValue;
        return;
    }

    // ✅ Animated update
    animateDigitChange(element, formattedValue);
    previousValues[elementId] = formattedValue;
}

function animateDigitChange(element, newValue) {
    // Create new digit element
    const newDigit = document.createElement('span');
    newDigit.className = 'countdown-number digit-enter';
    newDigit.textContent = newValue;

    // Mark old as exiting
    element.classList.add('digit-exit');

    // Insert new element (sibling of old)
    element.parentNode.appendChild(newDigit);

    // Cleanup after animation
    setTimeout(() => {
        // Remove old element
        if (element.parentNode) {
            element.remove();
        }
        // Finalize new element
        newDigit.classList.remove('digit-enter');
        newDigit.classList.add('countdown-number');
        newDigit.id = element.id || '';
    }, 400);
}

// تشغيل فوري
updateCountdown();

// تحديث كل ثانية
setInterval(updateCountdown, 1000);

// Console Branding
console.log(
    '%c ⏱️  IONECENTER Countdown v2.0 ',
    'background: #E31E24; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
);
console.log(
    '%c Launch Date: 2026-11-15 ',
    'color: #6e6e73; font-size: 11px;'
);