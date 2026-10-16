/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Order Page Script                             */
/*  WhatsApp Integration + Image Upload                        */
/* ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// ⚙️ Configuration
// ─────────────────────────────────────────────────────────────

// رقم WhatsApp Business لاستقبال الطلبات
const IONE_WHATSAPP = '8619120215218';

// الحد الأقصى للصور
const MAX_IMAGES = 10;

// ─────────────────────────────────────────────────────────────
// 📦 State
// ─────────────────────────────────────────────────────────────

let uploadedImages = [];

// ─────────────────────────────────────────────────────────────
// 🚀 Initialize
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    
    if (window.lucide) lucide.createIcons();
    
    const form = document.getElementById('orderForm');
    const fileInput = document.getElementById('fileInput');
    const cameraBtn = document.getElementById('cameraBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const uploadPreview = document.getElementById('uploadPreview');
    const submitBtn = document.getElementById('submitBtn');
    
    // 📸 Camera
    cameraBtn.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    });
    
    // 🖼️ Gallery
    galleryBtn.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.click();
    });
    
    // 📁 File Input Change
    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            if (uploadedImages.length >= MAX_IMAGES) {
                showToast(`الحد الأقصى ${MAX_IMAGES} صور`, 'warning');
                break;
            }
            
            if (!file.type.startsWith('image/')) {
                showToast('يُسمح بالصور فقط', 'error');
                continue;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast(`الصورة "${file.name}" كبيرة جداً`, 'error');
                continue;
            }
            
            try {
                const dataURL = await fileToDataURL(file);
                uploadedImages.push({ file, dataURL });
                renderPreview();
            } catch (error) {
                console.error('Error reading file:', error);
                showToast('فشل قراءة الصورة', 'error');
            }
        }
        
        fileInput.value = '';
    });
    
    // 👁️ Render Preview
    function renderPreview() {
        uploadPreview.innerHTML = uploadedImages.map((img, index) => `
            <div class="preview-item" data-index="${index}">
                <img src="${img.dataURL}" alt="صورة ${index + 1}">
                <button type="button" class="preview-remove" data-index="${index}">×</button>
            </div>
        `).join('');
        
        uploadPreview.querySelectorAll('.preview-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                uploadedImages.splice(index, 1);
                renderPreview();
            });
        });
    }
    
    // 🚀 Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        if (!data.name || !data.name.trim()) {
            showToast('يرجى إدخال الاسم', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        if (!data.phone || !data.phone.trim()) {
            showToast('يرجى إدخال رقم الواتساب', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        if (!data.product || !data.product.trim()) {
            showToast('يرجى إدخال وصف المنتج', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
            <span>جاري التحضير...</span>
        `;
        
        try {
            const message = buildWhatsAppMessage(data);
            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/${IONE_WHATSAPP}?text=${encodedMessage}`;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            window.open(whatsappURL, '_blank');
            
            showSuccess();
            
            setTimeout(() => {
                form.reset();
                uploadedImages = [];
                renderPreview();
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <i data-lucide="send"></i>
                    <span>إرسال الطلب عبر WhatsApp</span>
                `;
                if (window.lucide) lucide.createIcons();
            }, 3000);
            
        } catch (error) {
            console.error('Submit error:', error);
            showToast('حدث خطأ. حاول مرة أخرى', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <i data-lucide="send"></i>
                <span>إرسال الطلب عبر WhatsApp</span>
            `;
            if (window.lucide) lucide.createIcons();
        }
    });
    
    // 📝 Build WhatsApp Message
    function buildWhatsAppMessage(data) {
        const lines = [];
        
        lines.push('🌟 *طلب جديد — IONECENTER*');
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('👤 *بيانات العميل*');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push(`• الاسم: ${data.name}`);
        lines.push(`• الواتساب: ${data.phone}`);
        if (data.country) lines.push(`• البلد: ${data.country}`);
        
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('📦 *تفاصيل الطلب*');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push(`• المنتج: ${data.product}`);
        if (data.quantity && data.quantity !== '1') {
            lines.push(`• الكمية: ${data.quantity}`);
        }
        if (data.targetCountry) {
            lines.push(`• بلد التسليم: ${data.targetCountry}`);
        }
        if (data.notes) {
            lines.push(`• ملاحظات: ${data.notes}`);
        }
        
        lines.push('');
        if (uploadedImages.length > 0) {
            lines.push('━━━━━━━━━━━━━━━━━━━━━');
            lines.push(`📸 *الصور: ${uploadedImages.length} صورة*`);
            lines.push('━━━━━━━━━━━━━━━━━━━━━');
            lines.push('⚠️ سأرسل الصور في الرسائل التالية');
            lines.push('');
        }
        
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('📅 ' + new Date().toLocaleString('ar-EG'));
        lines.push('🔗 ionecenter.com');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        
        return lines.join('\n');
    }
    
    // ✨ Success Overlay
    function showSuccess() {
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay active';
        overlay.innerHTML = `
            <div class="success-icon">
                <i data-lucide="check-circle"></i>
            </div>
            <h2 class="success-title">تم بنجاح!</h2>
            <p class="success-text">
                تم فتح WhatsApp مع رسالتك.<br>
                يرجى إرسال الصور يدوياً هناك.
            </p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 20px;
                padding: 12px 32px;
                background: white;
                color: #34C759;
                border: none;
                border-radius: 12px;
                font-family: inherit;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
            ">
                حسناً، فهمت
            </button>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) lucide.createIcons();
        
        setTimeout(() => {
            if (overlay.parentElement) overlay.remove();
        }, 8000);
    }
    
    // 🍞 Toast
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
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: ${colors[type]};
            color: white;
            padding: 14px 24px;
            border-radius: 12px;
            font-family: inherit;
            font-weight: 600;
            font-size: 0.9rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 10000;
            transition: transform 0.3s ease;
            max-width: 90%;
            text-align: center;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // 🔧 Helpers
    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // 🎬 Console
    console.log(
        '%c 📱 IONECENTER Order Page ',
        'background: #E31E24; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
    );
    console.log(
        '%c WhatsApp: +' + IONE_WHATSAPP,
        'color: #34C759; font-size: 12px; font-weight: bold;'
    );
});

// Spin animation for loading
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);