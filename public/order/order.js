/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Order Page Script v3.0                        */
/*  WhatsApp + Cloudinary + Orders API (KV Storage)            */
/* ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// ⚙️ Configuration
// ─────────────────────────────────────────────────────────────

const IONE_WHATSAPP = '8619120215218';
const CLOUDINARY_CLOUD_NAME = 'xhfnelrf';
const CLOUDINARY_UPLOAD_PRESET = 'ione_unsigned';
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const API_SAVE_URL = '/api/orders/save';

// ─────────────────────────────────────────────────────────────
// 📦 State
// ─────────────────────────────────────────────────────────────

let uploadedImages = [];
let isUploading = false;

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
    
    // ───────────────────────────────────────────────────
    // 📸 Camera Button
    // ───────────────────────────────────────────────────
    cameraBtn.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    });
    
    // ───────────────────────────────────────────────────
    // 🖼️ Gallery Button
    // ───────────────────────────────────────────────────
    galleryBtn.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.click();
    });
    
    // ───────────────────────────────────────────────────
    // 📁 File Input Change
    // ───────────────────────────────────────────────────
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
            
            if (file.size > MAX_IMAGE_SIZE) {
                showToast(`الصورة "${file.name}" كبيرة جداً (5 MB max)`, 'error');
                continue;
            }
            
            try {
                const dataURL = await fileToDataURL(file);
                uploadedImages.push({ file, dataURL, cloudinaryUrl: null });
                renderPreview();
            } catch (error) {
                console.error('Error reading file:', error);
                showToast('فشل قراءة الصورة', 'error');
            }
        }
        
        fileInput.value = '';
    });
    
    // ───────────────────────────────────────────────────
    // 👁️ Render Preview
    // ───────────────────────────────────────────────────
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
    
    // ───────────────────────────────────────────────────
    // ☁️ Upload to Cloudinary
    // ───────────────────────────────────────────────────
    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'ione-orders');
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        return data.secure_url;
    }
    
    // ───────────────────────────────────────────────────
    // 📤 Upload All Images
    // ───────────────────────────────────────────────────
    async function uploadAllImages() {
        if (uploadedImages.length === 0) return [];
        
        showUploadProgress(0, uploadedImages.length);
        
        const urls = [];
        
        for (let i = 0; i < uploadedImages.length; i++) {
            const img = uploadedImages[i];
            
            try {
                if (!img.cloudinaryUrl) {
                    const url = await uploadToCloudinary(img.file);
                    img.cloudinaryUrl = url;
                }
                urls.push(img.cloudinaryUrl);
                showUploadProgress(i + 1, uploadedImages.length);
            } catch (error) {
                console.error('Upload error for image', i, error);
                showToast(`فشل رفع الصورة ${i + 1}`, 'error');
            }
        }
        
        hideUploadProgress();
        return urls.filter(url => url !== null && url !== undefined);
    }
    
    // ───────────────────────────────────────────────────
    // 💾 Save Order to API
    // ───────────────────────────────────────────────────
    async function saveOrderToAPI(data, imageUrls) {
        const payload = {
            customer_name: (data.name || '').trim(),
            customer_phone: (data.phone || '').trim(),
            customer_country: (data.country || '').trim(),
            product_description: (data.product || '').trim(),
            quantity: parseInt(data.quantity) || 1,
            target_country: (data.targetCountry || '').trim(),
            shipping_type: 'air',
            notes: (data.notes || '').trim(),
            raw_conversation: '',
            image_urls: imageUrls,
            source: 'pwa'
        };
        
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(API_SAVE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const result = await response.json();
                if (!result.success) throw new Error(result.error || 'Save failed');
                
                saveClientOrder(result.order_code, payload);
                return result;
                
            } catch (error) {
                lastError = error;
                console.warn(`Save attempt ${attempt} failed:`, error.message);
                if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
        
        throw lastError;
    }
    
    // ───────────────────────────────────────────────────
    // 💾 Save Client Order Locally
    // ───────────────────────────────────────────────────
    function saveClientOrder(orderCode, payload) {
        try {
            let clientId = localStorage.getItem('ione_client_id');
            if (!clientId) {
                clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('ione_client_id', clientId);
            }
            
            const historyRaw = localStorage.getItem('ione_order_history') || '[]';
            const history = JSON.parse(historyRaw);
            
            history.unshift({
                order_code: orderCode,
                customer_name: payload.customer_name,
                product_description: payload.product_description.substring(0, 80),
                image_count: payload.image_urls.length,
                status: 'new',
                created_at: new Date().toISOString()
            });
            
            localStorage.setItem('ione_order_history', JSON.stringify(history.slice(0, 50)));
        } catch (e) {
            console.warn('localStorage save failed:', e);
        }
    }
    
    // ───────────────────────────────────────────────────
    // 🚀 Form Submit
    // ───────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isUploading) {
            showToast('جاري رفع الصور... يرجى الانتظار', 'warning');
            return;
        }
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // ─────── Validation ───────
        if (!data.name || !data.name.trim()) {
            showToast('يرجى إدخال الاسم', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        const phoneCleaned = (data.phone || '').replace(/\D/g, '');
        if (phoneCleaned.length < 8) {
            showToast('يرجى إدخال رقم واتساب صحيح', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        if (!data.product || !data.product.trim()) {
            showToast('يرجى إدخال وصف المنتج', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        // ─────── Start ───────
        isUploading = true;
        submitBtn.disabled = true;
        
        const spinner = `<span class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>`;
        
        // Step 1: Upload Images
        submitBtn.innerHTML = `${spinner}<span>جاري رفع الصور...</span>`;
        
        let imageUrls = [];
        try {
            imageUrls = await uploadAllImages();
        } catch (error) {
            console.error('Upload error:', error);
            showToast('فشل رفع الصور. حاول مرة أخرى', 'error');
            isUploading = false;
            submitBtn.disabled = false;
            resetSubmitBtn(submitBtn);
            return;
        }
        
        // Step 2: Save to API
        submitBtn.innerHTML = `${spinner}<span>جاري حفظ الطلب...</span>`;
        
        let apiResult = null;
        let apiFailed = false;
        
        try {
            apiResult = await saveOrderToAPI(data, imageUrls);
            console.log('✅ Order saved:', apiResult.order_code);
        } catch (error) {
            console.error('❌ API save failed:', error);
            apiFailed = true;
            showToast('تعذّر حفظ الطلب — سيُرسل عبر WhatsApp', 'warning');
        }
        
        // Step 3: Open WhatsApp
        submitBtn.innerHTML = `${spinner}<span>جاري فتح WhatsApp...</span>`;
        
        try {
            const orderCode = apiResult ? apiResult.order_code : null;
            const message = buildWhatsAppMessage(data, imageUrls, orderCode);
            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/${IONE_WHATSAPP}?text=${encodedMessage}`;
            
            await new Promise(resolve => setTimeout(resolve, 400));
            window.open(whatsappURL, '_blank');
            
            showSuccess(orderCode, imageUrls.length, apiFailed);
            
            setTimeout(() => {
                form.reset();
                uploadedImages = [];
                renderPreview();
                isUploading = false;
                submitBtn.disabled = false;
                resetSubmitBtn(submitBtn);
            }, 3000);
            
        } catch (error) {
            console.error('WhatsApp error:', error);
            showToast('حدث خطأ. حاول مرة أخرى', 'error');
            isUploading = false;
            submitBtn.disabled = false;
            resetSubmitBtn(submitBtn);
        }
    });
    
    // ───────────────────────────────────────────────────
    // 📝 Build WhatsApp Message
    // ───────────────────────────────────────────────────
    function buildWhatsAppMessage(data, imageUrls = [], orderCode = null) {
        const lines = [];
        
        lines.push('🌟 *طلب جديد — IONECENTER*');
        if (orderCode) lines.push(`🔖 *رقم الطلب:* ${orderCode}`);
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
        if (data.quantity && data.quantity !== '1') lines.push(`• الكمية: ${data.quantity}`);
        if (data.targetCountry) lines.push(`• بلد التسليم: ${data.targetCountry}`);
        if (data.notes) lines.push(`• ملاحظات: ${data.notes}`);
        
        if (imageUrls.length > 0) {
            lines.push('');
            lines.push('━━━━━━━━━━━━━━━━━━━━━');
            lines.push(`📸 *صور المنتج (${imageUrls.length})*`);
            lines.push('━━━━━━━━━━━━━━━━━━━━━');
            lines.push('');
            imageUrls.forEach((url, index) => {
                lines.push(`${index + 1}. ${url}`);
            });
        }
        
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('📅 ' + new Date().toLocaleString('ar-EG'));
        lines.push('🔗 ionecenter.com');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        
        return lines.join('\n');
    }
    
    // ───────────────────────────────────────────────────
    // 📊 Upload Progress UI
    // ───────────────────────────────────────────────────
    function showUploadProgress(current, total) {
        let progressEl = document.getElementById('uploadProgress');
        
        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.id = 'uploadProgress';
            progressEl.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                color: white;
                padding: 20px;
                text-align: center;
                z-index: 9999;
                font-family: 'Cairo', sans-serif;
                font-size: 1rem;
                font-weight: 600;
            `;
            document.body.appendChild(progressEl);
        }
        
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        
        progressEl.innerHTML = `
            <div style="margin-bottom: 8px;">☁️ جاري رفع الصور... ${current} / ${total}</div>
            <div style="
                width: 200px; height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                margin: 0 auto;
                overflow: hidden;
            ">
                <div style="
                    height: 100%;
                    width: ${percentage}%;
                    background: linear-gradient(90deg, #E31E24, #FF6B00);
                    border-radius: 3px;
                    transition: width 0.3s ease;
                "></div>
            </div>
        `;
    }
    
    function hideUploadProgress() {
        const progressEl = document.getElementById('uploadProgress');
        if (progressEl) progressEl.remove();
    }
    
    // ───────────────────────────────────────────────────
    // ✨ Success Overlay
    // ───────────────────────────────────────────────────
    function showSuccess(orderCode, imageCount, apiFailed = false) {
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay active';
        
        const codeDisplay = orderCode
            ? `<div style="
                    margin: 16px auto;
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.15);
                    border: 2px dashed rgba(255,255,255,0.5);
                    border-radius: 12px;
                    font-family: 'Courier New', monospace;
                    font-size: 1.3rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    display: inline-block;
                ">${orderCode}</div>
                <p style="font-size: 0.85rem; opacity: 0.8; margin-top: -8px;">
                    احتفظ برقم الطلب للمتابعة
                </p>`
            : '';
        
        overlay.innerHTML = `
            <div class="success-icon">
                <i data-lucide="${apiFailed ? 'alert-circle' : 'check-circle'}"></i>
            </div>
            <h2 class="success-title">${apiFailed ? 'تم الإرسال!' : 'تم بنجاح!'}</h2>
            ${codeDisplay}
            <p class="success-text">
                ${apiFailed 
                    ? 'تم فتح WhatsApp. يرجى إكمال الإرسال.' 
                    : 'تم استلام طلبك وحفظه في النظام.'}
                <br>
                ${imageCount > 0 ? `📸 تم رفع ${imageCount} صورة` : ''}
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
        }, 10000);
    }
    
    // ───────────────────────────────────────────────────
    // 🍞 Toast Notification
    // ───────────────────────────────────────────────────
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
            top: 20px; left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: ${colors[type]};
            color: white;
            padding: 14px 24px;
            border-radius: 12px;
            font-family: 'Cairo', sans-serif;
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
    
    // ───────────────────────────────────────────────────
    // 🔧 Helpers
    // ───────────────────────────────────────────────────
    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function resetSubmitBtn(btn) {
        btn.innerHTML = `
            <i data-lucide="send"></i>
            <span>إرسال الطلب عبر WhatsApp</span>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    // ───────────────────────────────────────────────────
    // 🎬 Console Branding
    // ───────────────────────────────────────────────────
    console.log(
        '%c 📱 IONECENTER Order Page v3.0 ',
        'background: #E31E24; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
    );
    console.log('%c API: ' + API_SAVE_URL, 'color: #0071e3; font-size: 12px; font-weight: bold;');
    console.log('%c WhatsApp: +' + IONE_WHATSAPP, 'color: #34C759; font-size: 12px; font-weight: bold;');
    console.log('%c Cloudinary: ' + CLOUDINARY_CLOUD_NAME, 'color: #6e6e73; font-size: 12px;');
});

// Spin animation
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);