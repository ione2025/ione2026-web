/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Get Dashboard Layout API                      */
/*  GET /api/dashboard/get                                     */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        
        const layoutRaw = await env.IONE_KV.get('dashboard:layout');
        const layout = layoutRaw ? JSON.parse(layoutRaw) : null; // null = default layout
        
        return new Response(JSON.stringify({ success: true, layout }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}