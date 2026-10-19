export async function onRequest(context) {
    const { request, env } = context;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response(JSON.stringify({ success: false, error: 'معرف المستخدم مطلوب' }), { status: 400, headers });
        }

        // التحقق من وجود المستخدم قبل الحذف
        const userKey = `user:${id}`;
        const existingUser = await env.IONE_KV.get(userKey);
        
        if (!existingUser) {
            return new Response(JSON.stringify({ success: false, error: 'المستخدم غير موجود' }), { status: 404, headers });
        }

        // حذف المستخدم من قاعدة البيانات
        await env.IONE_KV.delete(userKey);

        return new Response(JSON.stringify({ success: true, message: 'تم حذف المستخدم بنجاح' }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'حدث خطأ: ' + error.message }), { status: 500, headers });
    }
}