/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — List Journal & Accounts API                   */
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
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        
        // 1. جلب الحسابات (الصناديق من المفتاح الصحيح)
        const banksRaw = await env.IONE_KV.get('banks:list');
        const banks = banksRaw ? JSON.parse(banksRaw) : [];
        
        const accounts = [
            { id: 'acc_expenses', name: 'مصروفات عامة', type: 'expense' },
            { id: 'acc_sales', name: 'إيرادات المبيعات', type: 'revenue' },
            { id: 'acc_customers', name: 'العملاء', type: 'asset' },
            { id: 'acc_suppliers', name: 'الموردون', type: 'liability' }
        ];
        
        banks.forEach(b => {
            if (b.status !== 'deleted') {
                accounts.push({ id: b.box_id, name: b.name + ' (' + b.currency + ')', type: 'asset' });
            }
        });

        // 2. جلب القيود
        const listRaw = await env.IONE_KV.get('journal:list');
        const journal = listRaw ? JSON.parse(listRaw) : [];
        
        return new Response(JSON.stringify({
            success: true,
            journal,
            accounts 
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
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