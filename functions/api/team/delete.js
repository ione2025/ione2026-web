export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
        const body = await request.json();
        const listRaw = await env.IONE_KV.get('team:list');
        let list = listRaw ? JSON.parse(listRaw) : [];
        list = list.filter(t => t.id !== body.id);
        await env.IONE_KV.put('team:list', JSON.stringify(list));
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (e) { return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers }); }
}