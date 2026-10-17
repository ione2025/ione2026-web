export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const body = await request.json();
        const listRaw = await env.IONE_KV.get('customers:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        
        const customer = {
            id: 'cust_' + Date.now(),
            name: body.name,
            company: body.company || '',
            contact: body.contact || '',
            email: body.email || '',
            whatsapp: body.whatsapp || '',
            wechat: body.wechat || '',
            address: body.address || '',
            shipping_address: body.shipping_address || '',
            business_scope: body.business_scope || '',
            country: body.country || 'US', // الكود الدولي مثل US, PS, JO
            type: body.type || 'offline', // online أو offline
            orders_count: 0,
            total_purchases: 0,
            image_url: body.image_url || '',
            created_at: new Date().toISOString()
        };
        
        list.unshift(customer);
        await env.IONE_KV.put('customers:list', JSON.stringify(list));
        return new Response(JSON.stringify({ success: true, customer }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}