/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Delete Bank API                               */
/*  POST /api/banks/delete                                     */
/*  Body: { box_id }                                           */
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
                              payload.permissions.includes('delete_banks')
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
        
        // ─────── Soft Delete ───────
        bank.status = 'deleted';
        bank.deleted_at = new Date().toISOString();
        bank.deleted_by = payload.email || payload.username || 'unknown';
        bank.updated_at = new Date().toISOString();
        
        await env.IONE_KV.put(bankKey, JSON.stringify(bank));
        
        // ─────── Update List ───────
        const listRaw = await env.IONE_KV.get('banks:list');
        const banksList = listRaw ? JSON.parse(listRaw) : [];
        
        const idx = banksList.findIndex(b => b.box_id === box_id);
        if (idx !== -1) {
            banksList[idx].status = 'deleted';
            banksList[idx].updated_at = bank.updated_at;
            await env.IONE_KV.put('banks:list', JSON.stringify(banksList));
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم حذف الصندوق (يمكن استرجاعه)',
            box_id
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
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