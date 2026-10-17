/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — List Vouchers API                             */
/*  GET /api/vouchers/list                                     */
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
                              payload.permissions.includes('view_vouchers')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        const url = new URL(request.url);
        const filterType = url.searchParams.get('type') || 'all';
        const searchQuery = (url.searchParams.get('q') || '').toLowerCase();
        
        const listRaw = await env.IONE_KV.get('vouchers:list');
        let vouchers = listRaw ? JSON.parse(listRaw) : [];
        
        if (filterType !== 'all') {
            vouchers = vouchers.filter(v => v.type === filterType);
        }
        
        if (searchQuery) {
            vouchers = vouchers.filter(v => 
                (v.voucher_code || '').toLowerCase().includes(searchQuery) ||
                (v.from_box_name || '').toLowerCase().includes(searchQuery) ||
                (v.to_box_name || '').toLowerCase().includes(searchQuery) ||
                (v.notes || '').toLowerCase().includes(searchQuery)
            );
        }
        
        return new Response(JSON.stringify({
            success: true,
            vouchers,
            count: vouchers.length
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