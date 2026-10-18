export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    try {
        const body = await request.json();
        const { id, status, reply } = body;

        if (!id) {
            return new Response(JSON.stringify({ success: false, error: 'ID missing' }), { status: 400, headers });
        }

        const listRaw = await env.IONE_KV.get('status:notes_list');
        let list = listRaw ? JSON.parse(listRaw) : [];
        
        const index = list.findIndex(note => note.id === id);
        
        if (index !== -1) {
            if (status) list[index].status = status;
            if (reply) {
                list[index].reply = reply;
                list[index].replied_at = new Date().toISOString();
            }
            
            await env.IONE_KV.put('status:notes_list', JSON.stringify(list));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        } else {
            return new Response(JSON.stringify({ success: false, error: 'Note not found' }), { status: 404, headers });
        }
    } catch (e) { 
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers }); 
    }
}
