export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        const body = await request.json();
        const listRaw = await env.IONE_KV.get('products:list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        
        // إذا لم يتم توفير باركود، نولد باركود تلقائي
        let finalBarcode = body.barcode;
        if (!finalBarcode) {
            finalBarcode = 'PRD-' + Math.floor(100000 + Math.random() * 900000);
        }

        const product = {
            id: 'prod_' + Date.now(),
            name: body.name,
            images: body.images || [], // مصفوفة الصور
            category: body.category, // التصنيف المختار
            variants: body.variants || [], // لوحة الخيارات (ألوان/مقاسات)
            barcode: finalBarcode,
            buy_price_cny: parseFloat(body.buy_price_cny) || 0,
            sell_price_usd: parseFloat(body.sell_price_usd) || 0,
            dimensions: {
                length: parseFloat(body.length) || 0,
                width: parseFloat(body.width) || 0,
                height: parseFloat(body.height) || 0,
                weight: parseFloat(body.weight) || 0,
                cbm: parseFloat(body.cbm) || 0
            },
            packing: {
                ctn_qty: parseFloat(body.ctn_qty) || 0,
                total_weight: parseFloat(body.total_weight) || 0
            },
            countries: body.countries || [], // دول الشحن
            created_at: new Date().toISOString()
        };
        
        list.unshift(product);
        await env.IONE_KV.put('products:list', JSON.stringify(list));
        return new Response(JSON.stringify({ success: true, product }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}