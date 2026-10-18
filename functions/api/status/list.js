export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        // جلب الملاحظات من التخزين
        const listRaw = await env.IONE_KV.get('status:notes_list');
        const notes = listRaw ? JSON.parse(listRaw) : [];
        
        return new Response(JSON.stringify({ 
            success: true, 
            notes: notes 
        }), { status: 200, headers });
        
    } catch (e) { 
        return new Response(JSON.stringify({ 
            success: false, 
            error: e.message 
        }), { status: 500, headers }); 
    }
}