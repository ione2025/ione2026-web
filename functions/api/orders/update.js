/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Update Order API v2.0                         */
/*  POST /api/orders/update                                    */
/*  Body: { order_code, action, ...data }                      */
/*                                                             */
/*  Actions:                                                   */
/*  - set_status: { status }                                   */
/*  - soft_delete                                              */
/*  - restore                                                  */
/*  - update_notes: { notes }                                  */
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
        
        // ─────── Parse Body ───────
        const body = await request.json();
        const { order_code, action } = body;
        
        if (!order_code || !action) {
            return new Response(JSON.stringify({
                success: false, error: 'order_code and action required'
            }), { status: 400, headers });
        }
        
        // ─────── Get Order ───────
        const orderKey = `order:${order_code}`;
        const orderRaw = await env.IONE_KV.get(orderKey);
        
        if (!orderRaw) {
            return new Response(JSON.stringify({
                success: false, error: 'Order not found'
            }), { status: 404, headers });
        }
        
        const order = JSON.parse(orderRaw);
        
        // ─────── Handle Action ───────
        switch (action) {
            case 'set_status': {
                const { status } = body;
                const validStatuses = ['new', 'pending', 'progress', 'done', 'cancelled'];
                
                if (!validStatuses.includes(status)) {
                    return new Response(JSON.stringify({
                        success: false, error: 'Invalid status'
                    }), { status: 400, headers });
                }
                
                order.status = status;
                order.updated_at = new Date().toISOString();
                order.updated_by = payload.email || payload.username || 'unknown';
                break;
            }
            
            case 'soft_delete': {
                order.previous_status = order.status;
                order.status = 'deleted';
                order.deleted_at = new Date().toISOString();
                order.deleted_by = payload.email || payload.username || 'unknown';
                order.updated_at = new Date().toISOString();
                break;
            }
            
            case 'restore': {
                order.status = order.previous_status || 'new';
                delete order.deleted_at;
                delete order.deleted_by;
                delete order.previous_status;
                order.updated_at = new Date().toISOString();
                break;
            }
            
            case 'update_notes': {
                const { notes } = body;
                order.notes = notes || '';
                order.updated_at = new Date().toISOString();
                order.updated_by = payload.email || payload.username || 'unknown';
                break;
            }
            
            default:
                return new Response(JSON.stringify({
                    success: false, error: `Unknown action: ${action}`
                }), { status: 400, headers });
        }
        
        // ─────── Save Order ───────
        await env.IONE_KV.put(orderKey, JSON.stringify(order));
        
        // ─────── Update List ───────
        const listRaw = await env.IONE_KV.get('orders:list');
        const ordersList = listRaw ? JSON.parse(listRaw) : [];
        
        const idx = ordersList.findIndex(o => o.order_code === order_code);
        if (idx !== -1) {
            ordersList[idx].status = order.status;
            ordersList[idx].updated_at = order.updated_at;
            await env.IONE_KV.put('orders:list', JSON.stringify(ordersList));
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم التحديث بنجاح',
            action,
            order
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