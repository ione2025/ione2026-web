<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>IONECENTER — الصناديق والبنوك</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <link rel="icon" type="image/png" href="../../assets/logo.png">
    <link rel="stylesheet" href="../admin.css">
    <link rel="stylesheet" href="../_assets/dashboard.css">
    <style>
        /* ═══ Stats Row ═══ */
        .stats-row {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        .stat-chip {
            padding: 12px 20px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .stat-chip strong {
            color: var(--text-primary);
            font-size: 1.1rem;
        }
        .stat-chip.currency-USD strong { color: #34C759; }
        .stat-chip.currency-CNY strong { color: #FF3B30; }
        .stat-chip.currency-EUR strong { color: #0071e3; }
        .stat-chip.currency-ILS strong { color: #00bcd4; }

        /* ═══ Sections ═══ */
        .section-container {
            margin-bottom: 30px;
        }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }
        .section-title {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-title svg {
            width: 22px;
            height: 22px;
            color: var(--ione-red);
        }

        /* ═══ Grid Systems ═══ */
        .grid-large {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            min-height: 160px;
        }
        .grid-medium {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
            min-height: 120px;
        }
        @media (max-width: 1200px) {
            .grid-large { grid-template-columns: repeat(2, 1fr); }
            .grid-medium { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
            .grid-large, .grid-medium { grid-template-columns: 1fr; }
        }

        /* ═══ Box Card ═══ */
        .box-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 16px;
            position: relative;
            cursor: grab;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .box-card:active { cursor: grabbing; }
        .box-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        
        /* ═══ Dynamic Colors by Type & Currency ═══ */
        .box-card.type-bank { background: linear-gradient(135deg, rgba(0,113,227,0.1), rgba(0,113,227,0.02)); }
        .box-card.type-cash { background: linear-gradient(135deg, rgba(255,159,10,0.1), rgba(255,159,10,0.02)); }
        .box-card.type-expense { background: linear-gradient(135deg, rgba(255,59,48,0.1), rgba(255,59,48,0.02)); }

        .currency-stripe { position: absolute; top: 0; right: 0; bottom: 0; width: 4px; }
        .currency-stripe.USD { background: #34C759; }
        .currency-stripe.CNY { background: #FF3B30; }
        .currency-stripe.EUR { background: #0071e3; }
        .currency-stripe.ILS { background: #00bcd4; }
        .currency-stripe.GBP { background: #8B5CF6; }
        .currency-stripe.AED { background: #10B981; }
        .currency-stripe.OTHER { background: #8E8E93; }

        .box-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            padding-right: 8px;
        }
        .box-name {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .box-name svg { width: 18px; height: 18px; color: var(--text-secondary); }
        .box-badge {
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            background: var(--bg-secondary);
            color: var(--text-secondary);
        }

        .box-balance {
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--text-primary);
            direction: ltr;
            text-align: right;
            margin-bottom: 4px;
            font-family: 'Inter', sans-serif;
        }
        .box-currency {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 600;
            margin-bottom: 12px;
        }
        .box-details {
            font-size: 0.75rem;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 8px;
            border-top: 1px dashed var(--border);
        }

        .box-actions {
            position: absolute;
            top: 16px;
            left: 16px;
            display: flex;
            gap: 6px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .box-card:hover .box-actions { opacity: 1; }
        .box-actions button {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: none;
            background: var(--bg-card);
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .box-actions button:hover { background: var(--ione-red); color: white; }
        .box-actions button svg { width: 14px; height: 14px; }

        .empty-slot {
            border: 2px dashed var(--border);
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            opacity: 0.3;
            font-size: 0.9rem;
            font-weight: 600;
        }

        /* ═══ Modal ═══ */
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000; padding: 20px;
            opacity: 0; visibility: hidden; transition: all 0.3s;
        }
        .modal-overlay.active { opacity: 1; visibility: visible; }
        .modal-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 32px; max-width: 480px; width: 100%;
            box-shadow: 0 24px 64px rgba(0,0,0,0.5);
            transform: scale(0.9); transition: transform 0.3s;
        }
        .modal-overlay.active .modal-box { transform: scale(1); }
        
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 24px;
        }
        .modal-title { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
        .modal-close { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
        .modal-close:hover { color: var(--ione-red); }

        .form-group { margin-bottom: 16px; }
        .form-group label {
            display: block; font-size: 0.85rem; font-weight: 700;
            color: var(--text-secondary); margin-bottom: 8px;
        }
        .form-control {
            width: 100%; padding: 12px 16px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-family: inherit; font-size: 0.95rem;
            outline: none; transition: border 0.2s;
        }
        .form-control:focus { border-color: var(--ione-red); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .btn-submit {
            width: 100%; padding: 14px;
            background: var(--ione-red); color: white;
            border: none; border-radius: var(--radius-md);
            font-size: 1rem; font-weight: 700; cursor: pointer;
            margin-top: 16px; transition: background 0.2s;
        }
        .btn-submit:hover { background: #d32f2f; }
    </style>
</head>
<body class="dashboard-page">
    
    <div class="top-bar">
        <div class="top-bar-logo">
            <a href="../dashboard.html" style="text-decoration: none;">
                <img src="../../assets/logo.png" alt="IONE CENTER">
            </a>
        </div>
        <div class="top-bar-user">
            <button class="logout-btn" onclick="openModal()" style="border: none; cursor: pointer;">
                <i data-lucide="plus"></i>
                <span>صندوق جديد</span>
            </button>
            <a href="../dashboard.html" class="logout-btn" style="text-decoration: none;">
                <i data-lucide="arrow-right"></i>
                <span>رجوع</span>
            </a>
        </div>
    </div>

    <div class="dashboard-container">
        
        <div class="page-header">
            <div>
                <h1 class="page-title">🏦 الصناديق والبنوك</h1>
                <p class="page-subtitle">إدارة الأرصدة والصناديق (اسحب وأفلت لترتيب الصناديق)</p>
            </div>
            <button class="logout-btn" onclick="loadBanks()" style="border: none; cursor: pointer; padding: 10px;">
                <i data-lucide="refresh-cw"></i>
            </button>
        </div>

        <!-- Stats -->
        <div class="stats-row" id="statsRow"></div>

        <!-- Sections -->
        <div class="section-container">
            <div class="section-header">
                <div class="section-title"><i data-lucide="layout-grid"></i> الصناديق الكبيرة (4)</div>
            </div>
            <div class="grid-large" id="grid1" data-section="1"></div>
        </div>

        <div class="section-container">
            <div class="section-header">
                <div class="section-title"><i data-lucide="layout-list"></i> الصناديق المتوسطة (6)</div>
            </div>
            <div class="grid-medium" id="grid2" data-section="2"></div>
        </div>

        <div class="section-container">
            <div class="section-header">
                <div class="section-title"><i data-lucide="layout-grid"></i> الصناديق الكبيرة (4)</div>
            </div>
            <div class="grid-large" id="grid3" data-section="3"></div>
        </div>

    </div>

    <!-- Modal -->
    <div class="modal-overlay" id="boxModal">
        <div class="modal-box">
            <div class="modal-header">
                <h2 class="modal-title" id="modalTitle">صندوق جديد</h2>
                <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
            </div>
            
            <form id="boxForm" onsubmit="saveBox(event)">
                <input type="hidden" id="boxId" value="">
                
                <div class="form-group">
                    <label>اسم الصندوق *</label>
                    <input type="text" id="boxName" class="form-control" placeholder="مثال: HSBC USD" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>النوع *</label>
                        <select id="boxType" class="form-control" required>
                            <option value="bank">بنك</option>
                            <option value="cash">نقدي</option>
                            <option value="expense">مصروفات</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>العملة *</label>
                        <input type="text" id="boxCurrency" class="form-control" placeholder="USD, CNY, ILS..." required style="text-transform: uppercase;">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>الرصيد الافتتاحي</label>
                        <input type="number" id="boxOpenBalance" class="form-control" step="0.01" value="0">
                    </div>
                    <div class="form-group" id="balanceGroup" style="display: none;">
                        <label>الرصيد الحالي</label>
                        <input type="number" id="boxBalance" class="form-control" step="0.01" value="0">
                    </div>
                </div>

                <div class="form-group">
                    <label>ملاحظات</label>
                    <input type="text" id="boxNotes" class="form-control" placeholder="اختياري...">
                </div>

                <button type="submit" class="btn-submit" id="submitBtn">حفظ الصندوق</button>
            </form>
        </div>
    </div>

    <script src="../admin.js"></script>
    <script>
        // ─────────────────────────────────────────────
        // 📦 State
        // ─────────────────────────────────────────────
        let allBanks = [];
        let sortables = {};

        // ─────────────────────────────────────────────
        // 🌐 Load Banks
        // ─────────────────────────────────────────────
        async function loadBanks() {
            try {
                const token = localStorage.getItem('ione_admin_token');
                const res = await fetch('/api/banks/list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                if (data.success) {
                    allBanks = data.banks;
                    renderStats(data.stats);
                    renderGrids();
                }
            } catch (err) {
                showToast('فشل تحميل البيانات', 'error');
            }
        }

        // ─────────────────────────────────────────────
        // 📊 Render Stats
        // ─────────────────────────────────────────────
        function renderStats(stats) {
            const row = document.getElementById('statsRow');
            let html = `<div class="stat-chip"><i data-lucide="box"></i> الإجمالي <strong>${stats.total}</strong></div>`;
            
            for (const [curr, amount] of Object.entries(stats.by_currency)) {
                if (amount !== 0) {
                    html += `<div class="stat-chip currency-${curr}">
                        ${curr} <strong>${amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                    </div>`;
                }
            }
            row.innerHTML = html;
            lucide.createIcons();
        }

        // ─────────────────────────────────────────────
        // 🎨 Render Grids
        // ─────────────────────────────────────────────
        function renderGrids() {
            // Clear
            ['grid1', 'grid2', 'grid3'].forEach(id => {
                document.getElementById(id).innerHTML = '';
            });

            // Sort and distribute
            const sorted = [...allBanks].sort((a, b) => {
                if (a.section !== b.section) return a.section - b.section;
                return (a.position || 0) - (b.position || 0);
            });

            sorted.forEach(bank => {
                let targetGrid = 'grid1';
                if (bank.section === 2) targetGrid = 'grid2';
                if (bank.section === 3) targetGrid = 'grid3';
                
                const el = createBoxElement(bank);
                document.getElementById(targetGrid).appendChild(el);
            });

            // Add empty slots visual (optional)
            addEmptySlots('grid1', 4);
            addEmptySlots('grid2', 6);
            addEmptySlots('grid3', 4);

            lucide.createIcons();
            initSortables();
        }

        function addEmptySlots(gridId, max) {
            const grid = document.getElementById(gridId);
            const count = grid.querySelectorAll('.box-card').length;
            // Just for visual padding, not draggable
            for (let i = count; i < max; i++) {
                const div = document.createElement('div');
                div.className = 'empty-slot';
                div.textContent = 'فارغ';
                grid.appendChild(div);
            }
        }

        // ─────────────────────────────────────────────
        // 📦 Create Box Card
        // ─────────────────────────────────────────────
        function createBoxElement(bank) {
            const div = document.createElement('div');
            div.className = `box-card type-${bank.type}`;
            div.dataset.id = bank.box_id;
            div.dataset.section = bank.section;

            const stripeClass = ['USD','CNY','EUR','ILS','GBP','AED'].includes(bank.currency) ? bank.currency : 'OTHER';
            
            const typeIcon = bank.type === 'bank' ? 'landmark' : (bank.type === 'cash' ? 'banknote' : 'receipt');
            
            const balance = parseFloat(bank.balance) || 0;
            const openBal = parseFloat(bank.open_balance) || 0;

            div.innerHTML = `
                <div class="currency-stripe ${stripeClass}"></div>
                <div class="box-actions">
                    <button onclick="editBox('${bank.box_id}')" title="تعديل"><i data-lucide="pencil"></i></button>
                    <button onclick="deleteBox('${bank.box_id}')" title="حذف"><i data-lucide="trash-2"></i></button>
                </div>
                <div class="box-header">
                    <div class="box-name"><i data-lucide="${typeIcon}"></i> ${bank.name}</div>
                    <div class="box-badge">${bank.type}</div>
                </div>
                <div class="box-balance">${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                <div class="box-currency">${bank.currency}</div>
                <div class="box-details">
                    <span>افتتاحي: ${openBal.toLocaleString('en-US')}</span>
                    <span>Q: ${bank.section}</span>
                </div>
            `;
            return div;
        }

        // ─────────────────────────────────────────────
        // 🖱️ Sortables (Drag & Drop)
        // ─────────────────────────────────────────────
        function initSortables() {
            ['grid1', 'grid2', 'grid3'].forEach(gridId => {
                const el = document.getElementById(gridId);
                if (sortables[gridId]) sortables[gridId].destroy();
                
                sortables[gridId] = new Sortable(el, {
                    group: 'shared', // set both lists to same group
                    animation: 150,
                    draggable: '.box-card',
                    filter: '.empty-slot',
                    onEnd: function(evt) {
                        updateOrder();
                    }
                });
            });
        }

        // ─────────────────────────────────────────────
        // 🔄 Update Order After Drag
        // ─────────────────────────────────────────────
        async function updateOrder() {
            const updates = [];
            
            ['grid1', 'grid2', 'grid3'].forEach((gridId, index) => {
                const sectionNum = index + 1;
                const cards = document.getElementById(gridId).querySelectorAll('.box-card');
                
                cards.forEach((card, pos) => {
                    updates.push({
                        box_id: card.dataset.id,
                        section: sectionNum,
                        position: pos
                    });
                });
            });

            // Send to API one by one (in real app, use bulk)
            const token = localStorage.getItem('ione_admin_token');
            
            // Optimistic UI update
            updates.forEach(u => {
                const idx = allBanks.findIndex(b => b.box_id === u.box_id);
                if (idx !== -1) {
                    allBanks[idx].section = u.section;
                    allBanks[idx].position = u.position;
                }
            });

            // Push to server
            try {
                for (const u of updates) {
                    await fetch('/api/banks/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(u)
                    });
                }
            } catch(e) { console.error('Order save failed', e); }
        }

        // ─────────────────────────────────────────────
        // 📝 Modal Logic
        // ─────────────────────────────────────────────
        function openModal(isEdit = false) {
            document.getElementById('boxModal').classList.add('active');
            if (!isEdit) {
                document.getElementById('boxForm').reset();
                document.getElementById('boxId').value = '';
                document.getElementById('modalTitle').textContent = 'صندوق جديد';
                document.getElementById('balanceGroup').style.display = 'none';
            }
        }

        function closeModal() {
            document.getElementById('boxModal').classList.remove('active');
        }

        function editBox(id) {
            const bank = allBanks.find(b => b.box_id === id);
            if (!bank) return;
            
            document.getElementById('boxId').value = bank.box_id;
            document.getElementById('boxName').value = bank.name;
            document.getElementById('boxType').value = bank.type;
            document.getElementById('boxCurrency').value = bank.currency;
            document.getElementById('boxOpenBalance').value = bank.open_balance;
            document.getElementById('boxBalance').value = bank.balance;
            document.getElementById('boxNotes').value = bank.notes || '';
            
            document.getElementById('balanceGroup').style.display = 'block';
            document.getElementById('modalTitle').textContent = 'تعديل الصندوق';
            openModal(true);
        }

        // ─────────────────────────────────────────────
        // 💾 Save Box
        // ─────────────────────────────────────────────
        async function saveBox(e) {
            e.preventDefault();
            const token = localStorage.getItem('ione_admin_token');
            const btn = document.getElementById('submitBtn');
            
            const id = document.getElementById('boxId').value;
            const isEdit = !!id;

            const payload = {
                box_id: id,
                name: document.getElementById('boxName').value,
                type: document.getElementById('boxType').value,
                currency: document.getElementById('boxCurrency').value,
                open_balance: document.getElementById('boxOpenBalance').value,
                notes: document.getElementById('boxNotes').value
            };

            if (isEdit) {
                payload.balance = document.getElementById('boxBalance').value;
            }

            btn.disabled = true;
            btn.textContent = 'جاري الحفظ...';

            try {
                const url = isEdit ? '/api/banks/update' : '/api/banks/save';
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                if (data.success) {
                    showToast(isEdit ? 'تم التعديل بنجاح' : 'تم الإنشاء بنجاح', 'success');
                    closeModal();
                    loadBanks();
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                showToast('فشل الحفظ: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'حفظ الصندوق';
            }
        }

        // ─────────────────────────────────────────────
        // 🗑️ Delete Box
        // ─────────────────────────────────────────────
        async function deleteBox(id) {
            if (!confirm('هل أنت متأكد من حذف هذا الصندوق؟')) return;
            
            const token = localStorage.getItem('ione_admin_token');
            try {
                const res = await fetch('/api/banks/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ box_id: id })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('تم الحذف', 'success');
                    loadBanks();
                }
            } catch (e) {
                showToast('فشل الحذف', 'error');
            }
        }

        // ─────────────────────────────────────────────
        // 🚀 Init
        // ─────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            loadBanks();
        });

        console.log(
            '%c 🏦 Banks Page v1.0 ',
            'background: #0071e3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
        );
    </script>
</body>
</html>