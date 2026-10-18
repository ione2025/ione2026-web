export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
    
    try {
        // ─────── Auth (الحماية) ───────
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        }
        
        const payload = await verifyToken(authHeader.substring(7), env);
        if (!payload) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), { status: 401, headers });
        }
        
        const hasAccess = payload.role === 'ceo' || (payload.permissions && (payload.permissions.includes('*') || payload.permissions.includes('create_boxes')));
        if (!hasAccess) {
            return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403, headers });
        }

        // ─────── Parse Body ───────
        const body = await request.json();
        const { name, currency, open_balance, notes } = body;
        
        if (!name || !currency) {
            return new Response(JSON.stringify({ success: false, error: 'اسم المصروف والعملة مطلوبان' }), { status: 400, headers });
        }
        
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const boxId = `exp_${timestamp}_${random}`;
        const now = new Date().toISOString();
        
        const expenseData = {
            box_id: boxId,
            name: name.trim(),
            currency: currency.trim().toUpperCase(),
            type: 'expense',
            open_balance: parseFloat(open_balance) || 0,
            balance: parseFloat(open_balance) || 0,
            section: 1,
            position: 999,
            notes: notes || '',
            status: 'active',
            created_at: now,
            updated_at: now
        };
        
        await env.IONE_KV.put(`bank:${boxId}`, JSON.stringify(expenseData));
        
        const listRaw = await env.IONE_KV.get('banks:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        list.push(expenseData);
        await env.IONE_KV.put('banks:list', JSON.stringify(list));
        
        return new Response(JSON.stringify({ success: true, message: 'تم إنشاء الصندوق بنجاح', expense: expenseData }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
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