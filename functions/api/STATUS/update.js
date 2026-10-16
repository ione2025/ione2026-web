/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Status Update API                             */
/*  POST /api/status/update                                    */
/*  Body: { page, status, note }                               */
/*  status: green | red | yellow                               */
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
        
        // Check permission
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('edit_status')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        // Parse body
        const body = await request.json();
        const { page, status, note } = body;
        
        if (!page || !status) {
            return new Response(JSON.stringify({
                success: false, error: 'Page and status required'
            }), { status: 400, headers });
        }
        
        if (!['green', 'red', 'yellow'].includes(status)) {
            return new Response(JSON.stringify({
                success: false, error: 'Invalid status'
            }), { status: 400, headers });
        }
        
        // Get current list
        const listRaw = await env.IONE_KV.get('status:list');
        const statusList = listRaw ? JSON.parse(listRaw) : {};
        
        // Update
        statusList[page] = {
            status,
            note: note || '',
            updated_at: new Date().toISOString(),
            updated_by: payload.email || payload.username || 'unknown'
        };
        
        // Save
        await env.IONE_KV.put('status:list', JSON.stringify(statusList));
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم تحديث الحالة',
            page,
            new_status: status
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