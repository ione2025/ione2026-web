/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Save Order API                                */
/*  POST /api/orders/save                                      */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Method not allowed' 
        }), { status: 405, headers });
    }
    
    try {
        const body = await request.json();
        const {
            customer_name,
            customer_phone,
            customer_country,
            product_description,
            quantity,
            target_country,
            shipping_type,
            notes,
            raw_conversation,
            image_urls,
            source
        } = body;
        
        // Validation
        if (!customer_name || !product_description) {
            return new Response(JSON.stringify({
                success: false,
                error: 'الاسم ووصف المنتج مطلوبان'
            }), { status: 400, headers });
        }
        
        // Generate Order Code
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 9000) + 1000;
        const orderCode = `ORD-${year}-${random}`;
        
        // Order data
        const orderId = `order:${orderCode}`;
        const orderData = {
            order_code: orderCode,
            customer_name,
            customer_phone: customer_phone || '',
            customer_country: customer_country || '',
            product_description,
            quantity: quantity || 1,
            target_country: target_country || '',
            shipping_type: shipping_type || 'air',
            notes: notes || '',
            raw_conversation: raw_conversation || '',
            image_urls: image_urls || [],
            source: source || 'pwa',
            status: 'new',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Save order
        await env.IONE_KV.put(orderId, JSON.stringify(orderData));
        
        // Add to orders list
        const listRaw = await env.IONE_KV.get('orders:list');
        const ordersList = listRaw ? JSON.parse(listRaw) : [];
        
        ordersList.unshift({
            order_code: orderCode,
            customer_name,
            product_description: product_description.substring(0, 60),
            target_country: target_country || '',
            status: 'new',
            created_at: orderData.created_at
        });
        
        await env.IONE_KV.put('orders:list', JSON.stringify(ordersList));
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم حفظ الطلب بنجاح',
            order_code: orderCode,
            order: orderData
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}