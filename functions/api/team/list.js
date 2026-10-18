export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    try {
        const listRaw = await env.IONE_KV.get('team:list');
        const team = listRaw ? JSON.parse(listRaw) : [];
        return new Response(JSON.stringify({ success: true, team }), { status: 200, headers });
    } catch (e) { return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers }); }
}