export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
    
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        
        const body = await request.json();
        const { code, amount, bank_id } = body;
        
        if (!code || !amount || !bank_id) return new Response(JSON.stringify({ success: false, error: 'بيانات ناقصة' }), { status: 400, headers });

        const invRaw = await env.IONE_KV.get(`invoice:${code}`);
        if (!invRaw) return new Response(JSON.stringify({ success: false, error: 'الفاتورة غير موجودة' }), { status: 404, headers });
        
        const inv = JSON.parse(invRaw);
        inv.paid_amount = (inv.paid_amount || 0) + parseFloat(amount);
        inv.balance = inv.total - inv.paid_amount;
        inv.status = inv.balance <= 0.01 ? 'paid' : 'partial';
        
        // خصم من صندوق البنك
        const bankRaw = await env.IONE_KV.get(`bank:${bank_id}`);
        if (bankRaw) {
            const bank = JSON.parse(bankRaw);
            bank.balance = (parseFloat(bank.balance) || 0) - parseFloat(amount);
            await env.IONE_KV.put(`bank:${bank_id}`, JSON.stringify(bank));
        }

        await env.IONE_KV.put(`invoice:${code}`, JSON.stringify(inv));

        // تحديث القائمة
        const listRaw = await env.IONE_KV.get('purchases:list');
        if (listRaw) {
            const list = JSON.parse(listRaw);
            const idx = list.findIndex(i => i.code === code);
            if (idx !== -1) { list[idx] = inv; await env.IONE_KV.put('purchases:list', JSON.stringify(list)); }
        }

        return new Response(JSON.stringify({ success: true, message: 'تم إضافة الدفعة', invoice: inv }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}