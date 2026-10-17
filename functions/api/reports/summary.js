export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    
    try {
        // 1. الصناديق (Banks) والأرصدة
        const banksRaw = await env.IONE_KV.get('banks:list');
        const banks = banksRaw ? JSON.parse(banksRaw) : [];
        const activeBanks = banks.filter(b => b.status !== 'deleted');
        
        const totalBanks = {};
        activeBanks.forEach(b => {
            const curr = b.currency || 'USD';
            totalBanks[curr] = (totalBanks[curr] || 0) + (parseFloat(b.balance) || 0);
        });

        // 2. الموردين والعملاء (حسب عدد الفواتير)
        const purchasesRaw = await env.IONE_KV.get('purchases:list');
        const purchases = purchasesRaw ? JSON.parse(purchasesRaw) : [];
        const salesRaw = await env.IONE_KV.get('sales:list');
        const sales = salesRaw ? JSON.parse(salesRaw) : [];

        const suppliersCount = new Set(purchases.map(p => p.supplier_name).filter(Boolean)).size;
        const customersCount = new Set(sales.map(s => s.customer_name).filter(Boolean)).size;

        // 3. المصروفات
        const expensesRaw = await env.IONE_KV.get('banks:list');
        const expenses = banksRaw ? JSON.parse(banksRaw).filter(b => b.type === 'expense') : [];
        const totalExpenses = {};
        expenses.forEach(e => {
            const curr = e.currency || 'USD';
            totalExpenses[curr] = (totalExpenses[curr] || 0) + (parseFloat(e.balance) || 0);
        });

        // 4. الفواتير (إجمالي المبيعات والمشتريات)
        let totalSales = 0, totalPurchases = 0;
        sales.forEach(s => { totalSales += parseFloat(s.total) || 0; });
        purchases.forEach(p => { totalPurchases += parseFloat(p.total) || 0; });

        return new Response(JSON.stringify({
            success: true,
            data: {
                banks: totalBanks,
                suppliers: suppliersCount,
                customers: customersCount,
                expenses: totalExpenses,
                totalSales,
                totalPurchases,
                invoices: { purchases: purchases.length, sales: sales.length }
            }
        }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}