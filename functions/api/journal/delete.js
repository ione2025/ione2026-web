/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Delete Journal Entry API                      */
/*  POST /api/journal/delete                                   */
/*  يقوم بإلغاء القيد وإرجاع الأرصدة للصناديق                  */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
    
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'No token' }), { status: 401, headers });
        
        const body = await request.json();
        const { entry_id } = body;
        
        if (!entry_id) {
            return new Response(JSON.stringify({ success: false, error: 'entry_id required' }), { status: 400, headers });
        }

        // 1. جلب القيد من KV
        const entryRaw = await env.IONE_KV.get(`journal:${entry_id}`);
        if (!entryRaw) {
            return new Response(JSON.stringify({ success: false, error: 'القيد غير موجود' }), { status: 404, headers });
        }
        
        const entry = JSON.parse(entryRaw);
        
        // 2. إرجاع الأرصدة (عكس العملية)
        const banksRaw = await env.IONE_KV.get('banks:list');
        if (banksRaw) {
            let banks = JSON.parse(banksRaw);
            let updated = false;

            // المدين كان قد زاد الرصيد، الآن ننقصه (لإلغاء القيد)
            entry.debits.forEach(dr => {
                const bIdx = banks.findIndex(b => b.box_id === dr.account_id);
                if (bIdx !== -1) {
                    banks[bIdx].balance = (parseFloat(banks[bIdx].balance) || 0) - parseFloat(dr.amount);
                    updated = true;
                }
            });

            // الدائن كان قد أنقص الرصيد، الآن نزيده (لإلغاء القيد)
            entry.credits.forEach(cr => {
                const bIdx = banks.findIndex(b => b.box_id === cr.account_id);
                if (bIdx !== -1) {
                    banks[bIdx].balance = (parseFloat(banks[bIdx].balance) || 0) + parseFloat(cr.amount);
                    updated = true;
                }
            });

            if (updated) await env.IONE_KV.put('banks:list', JSON.stringify(banks));
        }

        // 3. حذف القيد من KV
        await env.IONE_KV.delete(`journal:${entry_id}`);
        
        // 4. حذف القيد من القائمة
        const listRaw = await env.IONE_KV.get('journal:list');
        if (listRaw) {
            let journalList = JSON.parse(listRaw);
            journalList = journalList.filter(j => j.entry_id !== entry_id);
            await env.IONE_KV.put('journal:list', JSON.stringify(journalList));
        }
        
        return new Response(JSON.stringify({ success: true, message: 'تم حذف القيد وإرجاع الأرصدة' }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}