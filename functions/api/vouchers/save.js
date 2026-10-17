/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Save Voucher API                              */
/*  POST /api/vouchers/save                                    */
/*  Types: receipt (قبض) | payment (صرف) | transfer (تحويل)    */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false, error: 'Method not allowed'
        }), { status: 405, headers });
    }
    
    try {
        // ─────── Auth ───────
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false, error: 'No token'
            }), { status: 401, headers });
        }
        
        const payload = await verifyToken(authHeader.substring(7), env);
        if (!payload) {
            return new Response(JSON.stringify({
                success: false, error: 'Invalid token'
            }), { status: 401, headers });
        }
        
        // ─────── Permission ───────
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('create_vouchers')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        // ─────── Parse Body ───────
        const body = await request.json();
        const {
            type,           // receipt | payment | transfer
            from_box_id,    // للصرف والتحويل
            to_box_id,      // للقبض والتحويل
            amount,
            currency,
            exchange_rate,  // للتحويل بين عملات مختلفة
            date,
            notes,
            description
        } = body;
        
        // ─────── Validation ───────
        if (!type || !['receipt', 'payment', 'transfer'].includes(type)) {
            return new Response(JSON.stringify({
                success: false, error: 'نوع السند غير صحيح'
            }), { status: 400, headers });
        }
        
        if (!amount || parseFloat(amount) <= 0) {
            return new Response(JSON.stringify({
                success: false, error: 'المبلغ يجب أن يكون أكبر من صفر'
            }), { status: 400, headers });
        }
        
        // ─────── Get Boxes (for validation and balance update) ───────
        let fromBox = null;
        let toBox = null;
        
        if (from_box_id) {
            const raw = await env.IONE_KV.get(`bank:${from_box_id}`);
            if (!raw) {
                return new Response(JSON.stringify({
                    success: false, error: 'صندوق المصدر غير موجود'
                }), { status: 404, headers });
            }
            fromBox = JSON.parse(raw);
        }
        
        if (to_box_id) {
            const raw = await env.IONE_KV.get(`bank:${to_box_id}`);
            if (!raw) {
                return new Response(JSON.stringify({
                    success: false, error: 'صندوق الوجهة غير موجود'
                }), { status: 404, headers });
            }
            toBox = JSON.parse(raw);
        }
        
        // ─────── Type-specific validation ───────
        if (type === 'receipt' && !to_box_id) {
            return new Response(JSON.stringify({
                success: false, error: 'سند القبض يحتاج صندوق وجهة'
            }), { status: 400, headers });
        }
        
        if (type === 'payment' && !from_box_id) {
            return new Response(JSON.stringify({
                success: false, error: 'سند الصرف يحتاج صندوق مصدر'
            }), { status: 400, headers });
        }
        
        if (type === 'transfer' && (!from_box_id || !to_box_id)) {
            return new Response(JSON.stringify({
                success: false, error: 'سند التحويل يحتاج صندوقين'
            }), { status: 400, headers });
        }
        
        // ─────── Check Balance ───────
        if (fromBox) {
            const currentBal = parseFloat(fromBox.balance) || 0;
            const reqAmount = parseFloat(amount);
            
            if (currentBal < reqAmount) {
                return new Response(JSON.stringify({
                    success: false, 
                    error: `الرصيد غير كافٍ في ${fromBox.name}. المتاح: ${currentBal}`
                }), { status: 400, headers });
            }
        }
        
        // ─────── Generate Voucher Code ───────
        const now = new Date();
        const year = now.getFullYear();
        
        const prefixMap = {
            'receipt': 'RCV',
            'payment': 'PV',
            'transfer': 'TV'
        };
        const prefix = prefixMap[type];
        
        // Get counter for this year and type
        const counterKey = `counter:voucher:${prefix}:${year}`;
        const counterRaw = await env.IONE_KV.get(counterKey);
        const nextSeq = (counterRaw ? parseInt(counterRaw, 10) : 0) + 1;
        
        await env.IONE_KV.put(counterKey, String(nextSeq));
        
        const seqFormatted = String(nextSeq).padStart(4, '0');
        const voucherCode = `${prefix}-${year}-${seqFormatted}`;
        
        // ─────── Generate ID & Data ───────
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const voucherId = `vch_${timestamp}_${random}`;
        
        const amt = parseFloat(amount);
        const rate = parseFloat(exchange_rate) || 1;
        
        const voucherData = {
            voucher_id: voucherId,
            voucher_code: voucherCode,
            type,
            from_box_id: from_box_id || null,
            from_box_name: fromBox ? fromBox.name : null,
            to_box_id: to_box_id || null,
            to_box_name: toBox ? toBox.name : null,
            amount: amt,
            currency: currency || (fromBox ? fromBox.currency : toBox?.currency) || 'USD',
            exchange_rate: rate,
            converted_amount: amt * rate,
            date: date || now.toISOString().split('T')[0],
            notes: notes || '',
            description: description || '',
            status: 'posted',
            created_at: now.toISOString(),
            created_by: payload.email || payload.username || 'unknown'
        };
        
        // ─────── Update Balances ───────
        const updates = [];
        
        // 1. Deduct from source
        if (fromBox) {
            fromBox.balance = (parseFloat(fromBox.balance) || 0) - amt;
            fromBox.updated_at = now.toISOString();
            updates.push(env.IONE_KV.put(`bank:${fromBox.box_id}`, JSON.stringify(fromBox)));
        }
        
        // 2. Add to destination
        if (toBox) {
            const addAmount = type === 'transfer' ? (amt * rate) : amt;
            toBox.balance = (parseFloat(toBox.balance) || 0) + addAmount;
            toBox.updated_at = now.toISOString();
            updates.push(env.IONE_KV.put(`bank:${toBox.box_id}`, JSON.stringify(toBox)));
        }
        
        // 3. Save voucher
        updates.push(env.IONE_KV.put(`voucher:${voucherId}`, JSON.stringify(voucherData)));
        
        await Promise.all(updates);
        
        // ─────── Update Vouchers List ───────
        const listRaw = await env.IONE_KV.get('vouchers:list');
        const vouchersList = listRaw ? JSON.parse(listRaw) : [];
        
        vouchersList.unshift({
            voucher_id: voucherId,
            voucher_code: voucherCode,
            type,
            amount: amt,
            currency: voucherData.currency,
            from_box_name: voucherData.from_box_name,
            to_box_name: voucherData.to_box_name,
            date: voucherData.date,
            status: 'posted',
            created_at: voucherData.created_at
        });
        
        if (vouchersList.length > 1000) vouchersList.length = 1000;
        
        await env.IONE_KV.put('vouchers:list', JSON.stringify(vouchersList));
        
        // ─────── Update Banks List (for reflected balances) ───────
        const banksRaw = await env.IONE_KV.get('banks:list');
        if (banksRaw) {
            const banks = JSON.parse(banksRaw);
            if (fromBox) {
                const idx = banks.findIndex(b => b.box_id === fromBox.box_id);
                if (idx !== -1) banks[idx] = fromBox;
            }
            if (toBox) {
                const idx = banks.findIndex(b => b.box_id === toBox.box_id);
                if (idx !== -1) banks[idx] = toBox;
            }
            await env.IONE_KV.put('banks:list', JSON.stringify(banks));
        }
        
        // ─────── Response ───────
        return new Response(JSON.stringify({
            success: true,
            message: `تم إنشاء السند بنجاح (${voucherCode})`,
            voucher: voucherData
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false, error: error.message
        }), { status: 500, headers });
    }
}

// ─────────────────────────────────────────────────────────────
// 🔐 Verify JWT
// ─────────────────────────────────────────────────────────────
async function verifyToken(token, env) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [h, p, s] = parts;
        const encoder = new TextEncoder();
        const secret = env.JWT_SECRET || 'ione_super_secret_2026';
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const sigBin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const sig = new Uint8Array(sigBin.length);
        for (let i = 0; i < sigBin.length; i++) sig[i] = sigBin.charCodeAt(i);
        const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(`${h}.${p}`));
        if (!valid) return null;
        const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (e) { return null; }
}