/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Save Dashboard Layout API                     */
/*  POST /api/dashboard/save                                   */
/* ═══════════════════════════════════════════════════════════ */

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
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        
        const body = await request.json();
        const { layout } = body;
        
        if (!layout || !Array.isArray(layout)) {
            return new Response(JSON.stringify({ success: false, error: 'Layout data required' }), { status: 400, headers });
        }
        
        await env.IONE_KV.put('dashboard:layout', JSON.stringify(layout));
        
        return new Response(JSON.stringify({ success: true, message: 'تم حفظ الترتيب' }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}