export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const body = await request.json();
        const { customer_name, items, currency, total } = body;
        const now = new Date();
        const year = now.getFullYear();
        const dateStr = now.toISOString().split('T')[0];
        
        const counterRaw = await env.IONE_KV.get(`counter:s:${year}`);
        const nextSeq = (counterRaw ? parseInt(counterRaw) : 0) + 1;
        await env.IONE_KV.put(`counter:s:${year}`, String(nextSeq));
        
        const code = `S-${String(nextSeq).padStart(2,'0')}-CUSTOM-${dateStr}`;
        const sData = {
            code, type: 'sale', customer_name: customer_name || 'عميل مباشر',
            items: items || [], total: parseFloat(total) || 0, currency: currency || 'USD',
            paid_amount: 0, balance: parseFloat(total) || 0, status: 'unpaid',
            date: dateStr, created_at: now.toISOString()
        };
        
        await env.IONE_KV.put(`invoice:${code}`, JSON.stringify(sData));
        const listRaw = await env.IONE_KV.get('sales:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        list.unshift(sData);
        await env.IONE_KV.put('sales:list', JSON.stringify(list));
        
        return new Response(JSON.stringify({ success: true, invoice: sData }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}