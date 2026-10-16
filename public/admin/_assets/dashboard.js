/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Dashboard Builder                             */
/*  Drag & Drop, Rename, Customize Cards                       */
/* ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// 🔐 Auth Check
// ─────────────────────────────────────────────────────────────
if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    window.location.href = 'login.html';
}

// ─────────────────────────────────────────────────────────────
// 📦 State
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'ione_dashboard_layout';
let currentCard = null;
let selectedColor = null;

// Colors palette
const COLORS = [
    'red', 'green', 'blue', 'yellow',
    'purple', 'orange', 'cyan', 'pink'
];

const COLOR_VALUES = {
    red: '#E31E24',
    green: '#34C759',
    blue: '#0071e3',
    yellow: '#FF9F0A',
    purple: '#8B5CF6',
    orange: '#FF6B00',
    cyan: '#06B6D4',
    pink: '#EC4899'
};

// ─────────────────────────────────────────────────────────────
// 🚀 Initialize
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    
    // Icons
    if (window.lucide) lucide.createIcons();
    
    // Load saved layout
    loadLayout();
    
    // Initialize all Sortable containers
    initializeSortable();
    
    // Setup menu actions
    setupCardMenus();
    
    // Setup modals
    setupModals();
    
    // Setup toast container
    ensureToastContainer();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && typeof logout === 'function') {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                logout();
            }
        });
    }
    
    console.log('%c Dashboard Builder Ready ', 
        'background: #34C759; color: white; padding: 4px 8px; border-radius: 4px;');
});

// ─────────────────────────────────────────────────────────────
// 📦 Sortable Initialization
// ─────────────────────────────────────────────────────────────
function initializeSortable() {
    if (typeof Sortable === 'undefined') {
        console.error('SortableJS not loaded!');
        return;
    }
    
    const grids = document.querySelectorAll('.card-grid');
    
    grids.forEach(grid => {
        new Sortable(grid, {
            animation: 250,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            ghostClass: 'dragging',
            handle: '.card',
            filter: '.card-menu', // Don't drag when clicking menu
            onEnd: function() {
                saveLayout();
                showToast('تم حفظ الترتيب', 'success');
            }
        });
    });
}

// ─────────────────────────────────────────────────────────────
// 💾 Save / Load Layout (LocalStorage)
// ─────────────────────────────────────────────────────────────
function saveLayout() {
    try {
        const layout = {};
        
        document.querySelectorAll('.card-grid').forEach(grid => {
            const gridId = grid.dataset.grid || 'default';
            const cards = [];
            
            grid.querySelectorAll('.card').forEach(card => {
                cards.push({
                    id: card.dataset.cardId,
                    title: card.querySelector('.card-title')?.textContent || '',
                    subtitle: card.querySelector('.card-subtitle')?.textContent || '',
                    counter: card.querySelector('.card-counter')?.textContent || '',
                    icon: card.querySelector('.card-icon svg')?.getAttribute('data-lucide') 
                          || card.dataset.icon || 'square',
                    color: card.dataset.color || 'blue',
                    href: card.dataset.href || '#'
                });
            });
            
            layout[gridId] = cards;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        console.log('💾 Layout saved:', layout);
    } catch (e) {
        console.error('Save error:', e);
        showToast('فشل الحفظ', 'error');
    }
}

function loadLayout() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        
        const layout = JSON.parse(saved);
        
        Object.keys(layout).forEach(gridId => {
            const grid = document.querySelector(`[data-grid="${gridId}"]`);
            if (!grid) return;
            
            const cards = layout[gridId];
            
            // Remove existing cards
            grid.innerHTML = '';
            
            // Add cards in saved order
            cards.forEach(cardData => {
                grid.appendChild(createCardElement(cardData));
            });
        });
        
        if (window.lucide) lucide.createIcons();
        console.log('📂 Layout loaded');
    } catch (e) {
        console.error('Load error:', e);
    }
}

function createCardElement(data) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = data.href || '#';
    card.dataset.cardId = data.id || 'card-' + Date.now();
    card.dataset.color = data.color || 'blue';
    card.dataset.icon = data.icon || 'square';
    card.dataset.href = data.href || '#';
    
    card.innerHTML = `
        <button class="card-menu" data-menu="card">
            <i data-lucide="more-vertical"></i>
        </button>
        <div class="card-icon">
            <i data-lucide="${data.icon || 'square'}"></i>
        </div>
        <div class="card-title">${data.title || 'بطاقة جديدة'}</div>
        <div class="card-subtitle">${data.subtitle || ''}</div>
        ${data.counter ? `<div class="card-counter">${data.counter}</div>` : ''}
    `;
    
    return card;
}

// ─────────────────────────────────────────────────────────────
// ⚙️ Card Menu Actions
// ─────────────────────────────────────────────────────────────
function setupCardMenus() {
    // Context menu element
    const menu = document.getElementById('contextMenu');
    if (!menu) return;
    
    // Event delegation for all card-menu buttons
    document.addEventListener('click', (e) => {
        const menuBtn = e.target.closest('.card-menu');
        
        if (menuBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            currentCard = menuBtn.closest('.card');
            
            // Position menu
            const rect = menuBtn.getBoundingClientRect();
            menu.style.left = rect.left + 'px';
            menu.style.top = (rect.bottom + 8) + 'px';
            menu.classList.add('active');
            return;
        }
        
        // Close menu if clicked elsewhere
        if (!menu.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
    
    // Menu items
    menu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.dataset.action;
            handleMenuAction(action);
            menu.classList.remove('active');
        });
    });
}

function handleMenuAction(action) {
    if (!currentCard) return;
    
    switch (action) {
        case 'rename':
            openRenameModal();
            break;
        case 'color':
            openColorModal();
            break;
        case 'duplicate':
            duplicateCard();
            break;
        case 'delete':
            deleteCard();
            break;
    }
}

// ─────────────────────────────────────────────────────────────
// ✏️ Rename Card
// ─────────────────────────────────────────────────────────────
function openRenameModal() {
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    
    if (!modal || !input || !currentCard) return;
    
    // Prefill current values
    const currentTitle = currentCard.querySelector('.card-title')?.textContent || '';
    const currentSubtitle = currentCard.querySelector('.card-subtitle')?.textContent || '';
    
    input.value = currentTitle;
    
    // Store subtitle in a separate field
    const subtitleInput = document.getElementById('renameSubtitle');
    if (subtitleInput) subtitleInput.value = currentSubtitle;
    
    modal.classList.add('active');
    setTimeout(() => input.focus(), 100);
}

function saveRename() {
    if (!currentCard) return;
    
    const newTitle = document.getElementById('renameInput')?.value.trim();
    const newSubtitle = document.getElementById('renameSubtitle')?.value.trim() || '';
    
    if (!newTitle) {
        showToast('العنوان مطلوب', 'error');
        return;
    }
    
    const titleEl = currentCard.querySelector('.card-title');
    const subtitleEl = currentCard.querySelector('.card-subtitle');
    
    if (titleEl) titleEl.textContent = newTitle;
    if (subtitleEl) subtitleEl.textContent = newSubtitle;
    
    saveLayout();
    closeModals();
    showToast('تم إعادة التسمية', 'success');
}

// ─────────────────────────────────────────────────────────────
// 🎨 Color Picker
// ─────────────────────────────────────────────────────────────
function openColorModal() {
    const modal = document.getElementById('colorModal');
    if (!modal || !currentCard) return;
    
    selectedColor = currentCard.dataset.color || 'blue';
    
    // Render color options
    const grid = modal.querySelector('.color-grid');
    grid.innerHTML = COLORS.map(color => `
        <div class="color-option ${color === selectedColor ? 'selected' : ''}" 
             data-color="${color}"
             style="background: ${COLOR_VALUES[color]}">
        </div>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            grid.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedColor = opt.dataset.color;
        });
    });
    
    modal.classList.add('active');
}

function saveColor() {
    if (!currentCard || !selectedColor) return;
    
    currentCard.dataset.color = selectedColor;
    
    saveLayout();
    closeModals();
    showToast('تم تغيير اللون', 'success');
}

// ─────────────────────────────────────────────────────────────
// 📋 Duplicate / Delete
// ─────────────────────────────────────────────────────────────
function duplicateCard() {
    if (!currentCard) return;
    
    const clone = currentCard.cloneNode(true);
    clone.dataset.cardId = 'card-' + Date.now();
    clone.querySelector('.card-title').textContent += ' (نسخة)';
    
    currentCard.parentNode.insertBefore(clone, currentCard.nextSibling);
    
    if (window.lucide) lucide.createIcons();
    saveLayout();
    showToast('تم نسخ البطاقة', 'success');
}

function deleteCard() {
    if (!currentCard) return;
    
    if (!confirm('حذف هذه البطاقة؟')) return;
    
    currentCard.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        currentCard.remove();
        saveLayout();
        showToast('تم حذف البطاقة', 'success');
    }, 250);
}

// ─────────────────────────────────────────────────────────────
// 🪟 Modals Setup
// ─────────────────────────────────────────────────────────────
function setupModals() {
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModals();
        });
    });
    
    // Close button
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Rename save
    const renameSave = document.getElementById('renameSave');
    if (renameSave) renameSave.addEventListener('click', saveRename);
    
    // Color save
    const colorSave = document.getElementById('colorSave');
    if (colorSave) colorSave.addEventListener('click', saveColor);
    
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });
    
    // Enter key for rename
    const renameInput = document.getElementById('renameInput');
    if (renameInput) {
        renameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveRename();
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetLayout');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('إعادة تعيين التخطيط؟')) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        });
    }
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// ─────────────────────────────────────────────────────────────
// 🍞 Toast Notifications
// ─────────────────────────────────────────────────────────────
function ensureToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ─────────────────────────────────────────────────────────────
// 🌐 Global Error Handler
// ─────────────────────────────────────────────────────────────
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// ─────────────────────────────────────────────────────────────
// 🎨 Console Branding
// ─────────────────────────────────────────────────────────────
console.log(
    '%c IONECENTER Dashboard ',
    'background: #E31E24; color: white; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
);
console.log(
    '%c v1.0.0 — ' + new Date().toLocaleString('ar-EG'),
    'color: #6e6e73; font-size: 11px; padding: 2px;'
);