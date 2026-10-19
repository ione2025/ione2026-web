export async function onRequest(context) {
    const { request, env } = context;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

    try {
        // جلب جميع المفاتيح التي تبدأ بـ user:
        const list = await env.IONE_KV.list({ prefix: 'user:' });
        let users = [];
        let seenEmails = new Set();

        for (const key of list.keys) {
            const userRaw = await env.IONE_KV.get(key.name);
            if (userRaw) {
                const user = JSON.parse(userRaw);
                // منع التكرار (لأننا نحفظ المستخدم بالكود وبالبريد)
                if (!seenEmails.has(user.email)) {
                    seenEmails.add(user.email);
                    // لا نرسل كلمة المرور المشفرة للواجهة أبداً
                    delete user.password_hash; 
                    users.push(user);
                }
            }
        }

        // ترتيب المستخدمين من الأحدث للأقدم
        users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return new Response(JSON.stringify({ success: true, users }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'حدث خطأ: ' + error.message }), { status: 500, headers });
    }
}