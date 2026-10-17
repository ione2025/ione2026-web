/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — List Banks API                                */
/*  GET /api/banks/list                                        */
/*  Query: ?type=bank|cash|expense&currency=USD                */
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
                success: false, error: 'No token'
            }), { status: 401, headers });
        }
        
        const payload = await verifyToken(authHeader.substring(7), env);
        if (!payload) {
            return new Response(JSON.stringify({
                success: false, error: 'Invalid token'
            }), { status: 401, headers });
        }
        
        // ─────── Permission ───────
        const hasAccess = payload.role === 'ceo' || 
                          (payload.permissions && (
                              payload.permissions.includes('*') ||
                              payload.permissions.includes('view_banks')
                          ));
        
        if (!hasAccess) {
            return new Response(JSON.stringify({
                success: false, error: 'Forbidden'
            }), { status: 403, headers });
        }
        
        // ─────── Query ───────
        const url = new URL(request.url);
        const filterType = url.searchParams.get('type') || 'all';
        const filterCurrency = url.searchParams.get('currency') || 'all';
        
        // ─────── Get Banks ───────
        const banksRaw = await env.IONE_KV.get('banks:list');
        let banks = banksRaw ? JSON.parse(banksRaw) : [];
        
        // ─────── Filter ───────
        if (filterType !== 'all') {
            banks = banks.filter(b => b.type === filterType);
        }
        if (filterCurrency !== 'all') {
            banks = banks.filter(b => b.currency === filterCurrency);
        }
        
        // ─────── Filter Deleted ───────
        banks = banks.filter(b => b.status !== 'deleted');
        
        // ─────── Sort by Section + Position ───────
        banks.sort((a, b) => {
            if (a.section !== b.section) return a.section - b.section;
            return (a.position || 0) - (b.position || 0);
        });
        
        // ─────── Stats ───────
        const allRaw = await env.IONE_KV.get('banks:list');
        const allBanks = allRaw ? JSON.parse(allRaw) : [];
        const activeBanks = allBanks.filter(b => b.status !== 'deleted');
        
        const byCurrency = {};
        const byType = { bank: 0, cash: 0, expense: 0 };
        
        activeBanks.forEach(b => {
            const curr = b.currency || 'USD';
            byCurrency[curr] = (byCurrency[curr] || 0) + (parseFloat(b.balance) || 0);
            if (byType[b.type] !== undefined) byType[b.type]++;
        });
        
        const stats = {
            total: activeBanks.length,
            by_type: byType,
            by_currency: byCurrency
        };
        
        return new Response(JSON.stringify({
            success: true,
            banks,
            count: banks.length,
            stats
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