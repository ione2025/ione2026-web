/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Update Bank API                               */
/*  POST /api/banks/update                                     */
/*  Body: { box_id, name, currency, balance, section, ... }    */
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
                              payload.permissions.includes('edit_banks')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        // ─────── Parse Body ───────
        const body = await request.json();
        const { box_id } = body;
        
        if (!box_id) {
            return new Response(JSON.stringify({
                success: false, error: 'box_id required'
            }), { status: 400, headers });
        }
        
        // ─────── Get Bank ───────
        const bankKey = `bank:${box_id}`;
        const bankRaw = await env.IONE_KV.get(bankKey);
        
        if (!bankRaw) {
            return new Response(JSON.stringify({
                success: false, error: 'Bank not found'
            }), { status: 404, headers });
        }
        
        const bank = JSON.parse(bankRaw);
        
        // ─────── Update Fields ───────
        // Only update provided fields
        if (body.name !== undefined) bank.name = body.name.trim();
        if (body.currency !== undefined) bank.currency = body.currency.trim().toUpperCase();
        if (body.type !== undefined && ['bank', 'cash', 'expense'].includes(body.type)) {
            bank.type = body.type;
        }
        if (body.open_balance !== undefined) {
            bank.open_balance = parseFloat(body.open_balance) || 0;
        }
        if (body.balance !== undefined) {
            bank.balance = parseFloat(body.balance) || 0;
        }
        if (body.section !== undefined) bank.section = parseInt(body.section) || 1;
        if (body.position !== undefined) bank.position = parseInt(body.position) || 0;
        if (body.notes !== undefined) bank.notes = body.notes || '';
        if (body.bg_image !== undefined) bank.bg_image = body.bg_image || '';
        
        bank.updated_at = new Date().toISOString();
        bank.updated_by = payload.email || payload.username || 'unknown';
        
        // ─────── Save to KV ───────
        await env.IONE_KV.put(bankKey, JSON.stringify(bank));
        
        // ─────── Update List ───────
        const listRaw = await env.IONE_KV.get('banks:list');
        const banksList = listRaw ? JSON.parse(listRaw) : [];
        
        const idx = banksList.findIndex(b => b.box_id === box_id);
        if (idx !== -1) {
            banksList[idx] = bank;
            await env.IONE_KV.put('banks:list', JSON.stringify(banksList));
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم تحديث الصندوق بنجاح',
            bank
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