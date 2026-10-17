/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Delete Voucher API                            */
/*  POST /api/vouchers/delete                                  */
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
        
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('delete_vouchers')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        const body = await request.json();
        const { voucher_id } = body;
        
        if (!voucher_id) {
            return new Response(JSON.stringify({
                success: false, error: 'voucher_id required'
            }), { status: 400, headers });
        }
        
        const vchRaw = await env.IONE_KV.get(`voucher:${voucher_id}`);
        if (!vchRaw) {
            return new Response(JSON.stringify({
                success: false, error: 'Voucher not found'
            }), { status: 404, headers });
        }
        
        const vch = JSON.parse(vchRaw);
        
        // Revert balances if posted
        if (vch.status === 'posted') {
            if (vch.from_box_id) {
                const raw = await env.IONE_KV.get(`bank:${vch.from_box_id}`);
                if (raw) {
                    const box = JSON.parse(raw);
                    box.balance = (parseFloat(box.balance) || 0) + parseFloat(vch.amount);
                    await env.IONE_KV.put(`bank:${vch.from_box_id}`, JSON.stringify(box));
                }
            }
            if (vch.to_box_id) {
                const raw = await env.IONE_KV.get(`bank:${vch.to_box_id}`);
                if (raw) {
                    const box = JSON.parse(raw);
                    const addAmount = vch.type === 'transfer' ? parseFloat(vch.converted_amount) : parseFloat(vch.amount);
                    box.balance = (parseFloat(box.balance) || 0) - addAmount;
                    await env.IONE_KV.put(`bank:${vch.to_box_id}`, JSON.stringify(box));
                }
            }
        }
        
        vch.status = 'deleted';
        vch.deleted_at = new Date().toISOString();
        await env.IONE_KV.put(`voucher:${voucher_id}`, JSON.stringify(vch));
        
        // Update list
        const listRaw = await env.IONE_KV.get('vouchers:list');
        if (listRaw) {
            const list = JSON.parse(listRaw);
            const idx = list.findIndex(v => v.voucher_id === voucher_id);
            if (idx !== -1) {
                list[idx].status = 'deleted';
                await env.IONE_KV.put('vouchers:list', JSON.stringify(list));
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم إلغاء السند بنجاح'
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false, error: error.message
        }), { status: 500, headers });
    }
}

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