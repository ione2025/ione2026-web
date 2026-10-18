export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const body = await request.json();
        const { page, notes, assignee, sender } = body;

        const listRaw = await env.IONE_KV.get('status:notes_list');
        let list = listRaw ? JSON.parse(listRaw) : [];
        
        const newNote = {
            id: 'note_' + Date.now(),
            page: page,
            notes: notes,
            assignee: assignee || 'Unassigned',
            sender: sender || 'Admin',
            status: 'open',
            created_at: new Date().toISOString()
        };
        
        list.unshift(newNote);
        await env.IONE_KV.put('status:notes_list', JSON.stringify(list));
        
        return new Response(JSON.stringify({ success: true, note: newNote }), { status: 200, headers });
    } catch (e) { 
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers }); 
    }
}