export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    try {
        const body = await request.json();
        const listRaw = await env.IONE_KV.get('team:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        
        // توليد كود تلقائي TM-01, TM-02
        let maxNum = 0;
        list.forEach(t => {
            const num = parseInt((t.code || '').replace('TM-', ''));
            if (num > maxNum) maxNum = num;
        });
        const code = 'TM-' + String(maxNum + 1).padStart(2, '0');

        const member = { id: 'tm_' + Date.now(), code, ...body, created_at: new Date().toISOString() };
        list.push(member);
        await env.IONE_KV.put('team:list', JSON.stringify(list));
        return new Response(JSON.stringify({ success: true, member }), { status: 200, headers });
    } catch (e) { return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers }); }
}