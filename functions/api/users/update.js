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
        const { id, email, full_name, phone, whatsapp, wechat, address, role, permissions, active, userCode } = body;

        // التحقق من وجود المستخدم
        const userKey = `user:${id}`;
        const existingUserRaw = await env.IONE_KV.get(userKey);
        
        if (!existingUserRaw) {
            return new Response(JSON.stringify({ success: false, error: 'المستخدم غير موجود' }), { status: 404, headers });
        }

        let existingUser = JSON.parse(existingUserRaw);

        // تحديث البيانات
        if (email) existingUser.email = email.toLowerCase().trim();
        if (full_name) existingUser.full_name = full_name;
        if (phone) existingUser.phone = phone;
        if (whatsapp) existingUser.whatsapp = whatsapp;
        if (wechat) existingUser.wechat = wechat;
        if (address) existingUser.address = address;
        if (role) existingUser.role = role;
        if (permissions) existingUser.permissions = permissions;
        if (active !== undefined) existingUser.active = active;
        if (userCode) existingUser.userCode = userCode.toLowerCase().trim();

        // حفظ التحديث
        await env.IONE_KV.put(userKey, JSON.stringify(existingUser));

        return new Response(JSON.stringify({ success: true, message: 'تم تحديث المستخدم بنجاح' }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'حدث خطأ: ' + error.message }), { status: 500, headers });
    }
}