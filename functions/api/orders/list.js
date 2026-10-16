/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — List Orders API                               */
/*  GET /api/orders/list                                       */
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
        // Verify token (Admin only)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No token provided'
            }), { status: 401, headers });
        }
        
        const token = authHeader.substring(7);
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token'
            }), { status: 401, headers });
        }
        
        // Check permission
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('view_orders')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false,
                error: 'غير مسموح — تحتاج صلاحية view_orders'
            }), { status: 403, headers });
        }
        
        // Get orders list summary
        const listRaw = await env.IONE_KV.get('orders:list');
        const ordersList = listRaw ? JSON.parse(listRaw) : [];
        
        return new Response(JSON.stringify({
            success: true,
            orders: ordersList,
            count: ordersList.length
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// ─────────────────────────────────────────────────────────────
// Verify JWT
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