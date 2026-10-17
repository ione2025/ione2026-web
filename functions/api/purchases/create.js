export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const body = await request.json();
        const { supplier_name, items, currency, total } = body;
        const now = new Date();
        const year = now.getFullYear();
        const dateStr = now.toISOString().split('T')[0];
        
        const counterRaw = await env.IONE_KV.get(`counter:pr:${year}`);
        const nextSeq = (counterRaw ? parseInt(counterRaw) : 0) + 1;
        await env.IONE_KV.put(`counter:pr:${year}`, String(nextSeq));
        
        const code = `PR-${String(nextSeq).padStart(2,'0')}-CUSTOM-${dateStr}`;
        const prData = {
            code, type: 'purchase', supplier_name: supplier_name || 'مورد مباشر',
            items: items || [], total: parseFloat(total) || 0, currency: currency || 'CNY',
            paid_amount: 0, balance: parseFloat(total) || 0, status: 'unpaid',
            date: dateStr, created_at: now.toISOString()
        };
        
        await env.IONE_KV.put(`invoice:${code}`, JSON.stringify(prData));
        const listRaw = await env.IONE_KV.get('purchases:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        list.unshift(prData);
        await env.IONE_KV.put('purchases:list', JSON.stringify(list));
        
        return new Response(JSON.stringify({ success: true, invoice: prData }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}