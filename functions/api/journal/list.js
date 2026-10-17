export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    try {
        // 1. التحقق من التوكن
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        }
        
        // 2. جلب الصناديق (الحسابات)
        const banksRaw = await env.IONE_KV.get('banks:list');
        const banks = banksRaw ? JSON.parse(banksRaw) : [];
        
        const accounts = [
            { id: 'acc_expenses', name: 'مصروفات عامة', type: 'expense' },
            { id: 'acc_sales', name: 'إيرادات المبيعات', type: 'revenue' },
            { id: 'acc_customers', name: 'العملاء', type: 'asset' },
            { id: 'acc_suppliers', name: 'الموردون', type: 'liability' }
        ];
        
        banks.forEach(b => {
            if (b.status !== 'deleted') {
                accounts.push({ id: b.box_id, name: b.name + ' (' + b.currency + ')', type: 'asset' });
            }
        });

        // 3. جلب القيود
        const listRaw = await env.IONE_KV.get('journal:list');
        const journal = listRaw ? JSON.parse(listRaw) : [];
        
        return new Response(JSON.stringify({
            success: true,
            journal: journal,
            accounts: accounts 
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}