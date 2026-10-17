/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Save Journal Entry API (Auto Balance Update)  */
/*  POST /api/journal/save                                     */
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
        const { date, description, debits, credits } = body; 
        // debits = [{ account_id, account_name, amount }, ...]
        // credits = [{ account_id, account_name, amount }, ...]

        // 1. التحقق من التوازن
        const totalDebit = debits.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const totalCredit = credits.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return new Response(JSON.stringify({ success: false, error: 'القيد غير متوازن' }), { status: 400, headers });
        }

        // 2. إنشاء القيد
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const entryId = `jnl_${timestamp}_${random}`;
        
        const year = new Date().getFullYear();
        const counterKey = `counter:journal:${year}`;
        const counterRaw = await env.IONE_KV.get(counterKey);
        const nextSeq = (counterRaw ? parseInt(counterRaw, 10) : 0) + 1;
        await env.IONE_KV.put(counterKey, String(nextSeq));
        const entryCode = `JE-${year}-${String(nextSeq).padStart(4, '0')}`;
        
        const entryData = {
            entry_id: entryId, entry_code: entryCode, date, description,
            debits, credits, total: totalDebit,
            created_at: new Date().toISOString()
        };
        
        await env.IONE_KV.put(`journal:${entryId}`, JSON.stringify(entryData));

        // 3. تحديث الأرصدة في الصناديق (تلقائياً)
        const banksRaw = await env.IONE_KV.get('banks:list');
        if (banksRaw) {
            let banks = JSON.parse(banksRaw);
            let updated = false;

            // المدين (يزيد الرصيد)
            debits.forEach(dr => {
                const bIdx = banks.findIndex(b => b.box_id === dr.account_id);
                if (bIdx !== -1) {
                    banks[bIdx].balance = (parseFloat(banks[bIdx].balance) || 0) + parseFloat(dr.amount);
                    updated = true;
                }
            });

            // الدائن (ينقص الرصيد)
            credits.forEach(cr => {
                const bIdx = banks.findIndex(b => b.box_id === cr.account_id);
                if (bIdx !== -1) {
                    banks[bIdx].balance = (parseFloat(banks[bIdx].balance) || 0) - parseFloat(cr.amount);
                    updated = true;
                }
            });

            if (updated) await env.IONE_KV.put('banks:list', JSON.stringify(banks));
        }

        // 4. إضافة للقائمة
        const listRaw = await env.IONE_KV.get('journal:list');
        const journalList = listRaw ? JSON.parse(listRaw) : [];
        journalList.unshift(entryData);
        await env.IONE_KV.put('journal:list', JSON.stringify(journalList));
        
        return new Response(JSON.stringify({ success: true, message: 'تم القيد وتحديث الأرصدة', entry: entryData }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function verifyToken(token, env) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [h, p, s] = parts;
        const encoder = new TextEncoder();
        const secret = env.JWT_SECRET || 'ione_super_secret_2026';
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const sigBin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const sig = new Uint8Array(sigBin.length);
        for (let i = 0; i < sigBin.length; i++) sig[i] = sigBin.charCodeAt(i);
        const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(`${h}.${p}`));
        if (!valid) return null;
        const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (e) { return null; }
}