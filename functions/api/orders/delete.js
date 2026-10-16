/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Delete Order API                              */
/*  POST /api/orders/delete                                    */
/*  Body: { order_code: 'ORD-...' }                            */
/*  Soft delete: status → 'deleted' (يبقى في KV)               */
/*  Hard delete: يُحذف من KV نهائياً (إذا status = new)        */
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
        // ─────────────────────────────────────────────
        // 🔐 Auth
        // ─────────────────────────────────────────────
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
        
        // ─────────────────────────────────────────────
        // 👤 Check permission
        // ─────────────────────────────────────────────
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('delete_orders')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        // ─────────────────────────────────────────────
        // 📦 Parse body
        // ─────────────────────────────────────────────
        const body = await request.json();
        const { order_code } = body;
        
        if (!order_code) {
            return new Response(JSON.stringify({
                success: false, error: 'Order code required'
            }), { status: 400, headers });
        }
        
        // ─────────────────────────────────────────────
        // 🔍 Get order
        // ─────────────────────────────────────────────
        const orderKey = `order:${order_code}`;
        const orderRaw = await env.IONE_KV.get(orderKey);
        
        if (!orderRaw) {
            return new Response(JSON.stringify({
                success: false, error: 'Order not found'
            }), { status: 404, headers });
        }
        
        const order = JSON.parse(orderRaw);
        const orderStatus = order.status || 'new';
        
        // ─────────────────────────────────────────────
        // 🗑️ Delete Logic
        // ─────────────────────────────────────────────
        // القاعدة:
        // - status = 'new' → Hard Delete (حذف نهائي)
        // - status = 'pending' → Hard Delete
        // - status = 'confirmed' أو ما بعدها → Soft Delete
        
        const hardDeleteStatuses = ['new', 'pending'];
        const isHardDelete = hardDeleteStatuses.includes(orderStatus);
        
        if (isHardDelete) {
            // ─────── HARD DELETE ───────
            // 1. حذف الطلب من KV
            await env.IONE_KV.delete(orderKey);
            
            // 2. حذف من orders:list
            const listRaw = await env.IONE_KV.get('orders:list');
            const ordersList = listRaw ? JSON.parse(listRaw) : [];
            const newList = ordersList.filter(o => o.order_code !== order_code);
            await env.IONE_KV.put('orders:list', JSON.stringify(newList));
            
            return new Response(JSON.stringify({
                success: true,
                message: 'تم حذف الطلب نهائياً',
                delete_type: 'hard',
                order_code
            }), { status: 200, headers });
            
        } else {
            // ─────── SOFT DELETE ───────
            // 1. تغيير الحالة إلى 'deleted'
            order.status = 'deleted';
            order.deleted_at = new Date().toISOString();
            order.deleted_by = payload.email || payload.username || 'unknown';
            order.updated_at = new Date().toISOString();
            
            await env.IONE_KV.put(orderKey, JSON.stringify(order));
            
            // 2. تحديث الحالة في orders:list
            const listRaw = await env.IONE_KV.get('orders:list');
            const ordersList = listRaw ? JSON.parse(listRaw) : [];
            
            const idx = ordersList.findIndex(o => o.order_code === order_code);
            if (idx !== -1) {
                ordersList[idx].status = 'deleted';
                await env.IONE_KV.put('orders:list', JSON.stringify(ordersList));
            }
            
            return new Response(JSON.stringify({
                success: true,
                message: 'تم حذف الطلب (يمكن استرجاعه)',
                delete_type: 'soft',
                order_code
            }), { status: 200, headers });
        }
        
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
        const key = await crypto.subtle.importKey(
            'raw', encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['verify']
        );
        const sigBin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const sig = new Uint8Array(sigBin.length);
        for (let i = 0; i < sigBin.length; i++) sig[i] = sigBin.charCodeAt(i);
        const valid = await crypto.subtle.verify(
            'HMAC', key, sig, encoder.encode(`${h}.${p}`)
        );
        if (!valid) return null;
        const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (e) { return null; }
}