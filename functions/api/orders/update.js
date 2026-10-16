/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Update Order Status API                       */
/*  POST /api/orders/update                                    */
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
        // Auth
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
                              payload.permissions.includes('edit_orders')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden — need edit_orders'
            }), { status: 403, headers });
        }
        
        // Get data
        const body = await request.json();
        const { order_code, status, notes } = body;
        
        if (!order_code) {
            return new Response(JSON.stringify({
                success: false, error: 'order_code required'
            }), { status: 400, headers });
        }
        
        // Fetch order
        const orderRaw = await env.IONE_KV.get(`order:${order_code}`);
        if (!orderRaw) {
            return new Response(JSON.stringify({
                success: false, error: 'Order not found'
            }), { status: 404, headers });
        }
        
        const order = JSON.parse(orderRaw);
        
        // Update fields
        if (status) order.status = status;
        if (notes !== undefined) order.notes = notes;
        order.updated_at = new Date().toISOString();
        order.updated_by = payload.email;
        
        // Save order
        await env.IONE_KV.put(`order:${order_code}`, JSON.stringify(order));
        
        // Update in list
        const listRaw = await env.IONE_KV.get('orders:list');
        if (listRaw) {
            const list = JSON.parse(listRaw);
            const idx = list.findIndex(o => o.order_code === order_code);
            if (idx !== -1) {
                list[idx].status = order.status;
                await env.IONE_KV.put('orders:list', JSON.stringify(list));
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم تحديث الطلب',
            order
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