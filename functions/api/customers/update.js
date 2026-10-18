export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
    
    try {
        // ─────── Auth (الحماية) ───────
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        }
        
        const payload = await verifyToken(authHeader.substring(7), env);
        if (!payload) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), { status: 401, headers });
        }

        // ─────── Parse Body ───────
        const body = await request.json();
        const { id, name, company, country, whatsapp, email, business_scope, address, shipping_address, image_url } = body;
        
        if (!id) return new Response(JSON.stringify({ success: false, error: 'Customer ID required' }), { status: 400, headers });

        const listRaw = await env.IONE_KV.get('customers:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        
        const index = list.findIndex(c => c.id === id);
        if (index === -1) {
            return new Response(JSON.stringify({ success: false, error: 'Customer not found' }), { status: 404, headers });
        }
        
        // تحديث الحقول
        list[index].name = name || list[index].name;
        list[index].company = company || list[index].company;
        list[index].country = country || list[index].country;
        list[index].whatsapp = whatsapp || list[index].whatsapp;
        list[index].email = email || list[index].email;
        list[index].business_scope = business_scope || list[index].business_scope;
        list[index].address = address || list[index].address;
        list[index].shipping_address = shipping_address || list[index].shipping_address;
        list[index].image_url = image_url || list[index].image_url;
        list[index].updated_at = new Date().toISOString();
        
        await env.IONE_KV.put('customers:list', JSON.stringify(list));
        
        return new Response(JSON.stringify({ success: true, customer: list[index] }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
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