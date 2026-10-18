export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        // التحقق من التوكن (اختياري، يمكن إبقاؤه للتأمين)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        }

        const listRaw = await env.IONE_KV.get('banks:list');
        let banks = listRaw ? JSON.parse(listRaw) : [];
        
        // فلترة المصروفات فقط
        let expenses = banks.filter(b => b.type === 'expense' && b.status !== 'deleted');
        
        const stats = { total: expenses.length, by_currency: {} };
        expenses.forEach(b => {
            const curr = b.currency || 'USD';
            stats.by_currency[curr] = (stats.by_currency[curr] || 0) + (parseFloat(b.balance) || 0);
        });
        
        return new Response(JSON.stringify({
            success: true,
            expenses,
            stats
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}