export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const body = await request.json();
        const { note_id } = body;
        
        if (!note_id) return new Response(JSON.stringify({ success: false, error: 'ID required' }), { status: 400, headers });

        const listRaw = await env.IONE_KV.get('status:notes_list');
        let list = listRaw ? JSON.parse(listRaw) : [];
        
        // تصفية القائمة لحذف البلاغ المحدد
        list = list.filter(n => n.id !== note_id);
        
        await env.IONE_KV.put('status:notes_list', JSON.stringify(list));
        
        return new Response(JSON.stringify({ success: true, message: 'تم حذف البلاغ' }), { status: 200, headers });
    } catch (e) { 
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers }); 
    }
}