/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — List Orders API v2.0                          */
/*  GET /api/orders/list                                       */
/*  Query params: ?status=new|pending|...&q=search             */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    try {
        // ─────── Auth ───────
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false, error: 'No token provided'
            }), { status: 401, headers });
        }
        
        const token = authHeader.substring(7);
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({
                success: false, error: 'Invalid token'
            }), { status: 401, headers });
        }
        
        // ─────── Check Permission ───────
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('view_orders')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'غير مسموح'
            }), { status: 403, headers });
        }
        
        // ─────── Parse Query ───────
        const url = new URL(request.url);
        const filterStatus = url.searchParams.get('status') || 'all';
        const searchQuery = (url.searchParams.get('q') || '').toLowerCase();
        const includeDeleted = url.searchParams.get('include_deleted') === 'true';
        
        // ─────── Get List ───────
        const listRaw = await env.IONE_KV.get('orders:list');
        let orders = listRaw ? JSON.parse(listRaw) : [];
        
        // ─────── Filter Deleted ───────
        if (!includeDeleted) {
            orders = orders.filter(o => o.status !== 'deleted');
        }
        
        // ─────── Filter Status ───────
        if (filterStatus !== 'all') {
            orders = orders.filter(o => o.status === filterStatus);
        }
        
        // ─────── Search ───────
        if (searchQuery) {
            orders = orders.filter(o => 
                (o.order_code || '').toLowerCase().includes(searchQuery) ||
                (o.customer_name || '').toLowerCase().includes(searchQuery) ||
                (o.product_description || '').toLowerCase().includes(searchQuery) ||
                (o.customer_phone || '').toLowerCase().includes(searchQuery)
            );
        }
        
        // ─────── Add Sequence + Color ───────
        const statusColors = {
            'new': 'yellow',
            'pending': 'yellow',
            'progress': 'yellow',
            'done': 'green',
            'cancelled': 'red',
            'deleted': 'gray'
        };
        
        orders = orders.map((o, i) => ({
            ...o,
            seq: i + 1,
            color: statusColors[o.status] || 'yellow'
        }));
        
        // ─────── Stats ───────
        const allRaw = await env.IONE_KV.get('orders:list');
        const allOrders = allRaw ? JSON.parse(allRaw) : [];
        const stats = {
            total: allOrders.filter(o => o.status !== 'deleted').length,
            new: allOrders.filter(o => o.status === 'new').length,
            pending: allOrders.filter(o => o.status === 'pending').length,
            progress: allOrders.filter(o => o.status === 'progress').length,
            done: allOrders.filter(o => o.status === 'done').length,
            cancelled: allOrders.filter(o => o.status === 'cancelled').length,
            deleted: allOrders.filter(o => o.status === 'deleted').length
        };
        
        return new Response(JSON.stringify({
            success: true,
            orders,
            count: orders.length,
            stats
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
        const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
        const dataToSign = `${headerEncoded}.${payloadEncoded}`;
        
        const encoder = new TextEncoder();
        const secret = env.JWT_SECRET || 'ione_super_secret_2026';
        
        const key = await crypto.subtle.importKey(
            'raw', encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['verify']
        );
        
        const signatureBinary = atob(
            signatureEncoded.replace(/-/g, '+').replace(/_/g, '/')
        );
        const signature = new Uint8Array(signatureBinary.length);
        for (let i = 0; i < signatureBinary.length; i++) {
            signature[i] = signatureBinary.charCodeAt(i);
        }
        
        const isValid = await crypto.subtle.verify(
            'HMAC', key, signature, encoder.encode(dataToSign)
        );
        
        if (!isValid) return null;
        
        const payloadBinary = atob(
            payloadEncoded.replace(/-/g, '+').replace(/_/g, '/')
        );
        const payload = JSON.parse(payloadBinary);
        
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        
        return payload;
    } catch (e) {
        return null;
    }
}
