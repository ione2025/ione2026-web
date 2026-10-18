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
        const { email, password, full_name, role, permissions, active, userCode, phone, address } = body;

        if (!email || !password || !userCode) {
            return new Response(JSON.stringify({ success: false, error: 'البريد، المرور، وكود الدخول مطلوبون' }), { status: 400, headers });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedCode = userCode.toLowerCase().trim();

        // التحقق من عدم وجود المستخدم مسبقاً
        const existingUser = await env.IONE_KV.get(`user:${normalizedEmail}`);
        if (existingUser) {
            return new Response(JSON.stringify({ success: false, error: 'البريد الإلكتروني مسجل مسبقاً' }), { status: 400, headers });
        }

        // تشفير كلمة المرور
        const encoder = new TextEncoder();
        const data = encoder.encode(password + '_IONE_SALT_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const userObject = {
            email: normalizedEmail,
            full_name,
            password_hash,
            role: role || 'user',
            permissions: permissions || [],
            active: active !== undefined ? active : true,
            userCode: normalizedCode,
            phone,
            address,
            created_at: new Date().toISOString()
        };

        const userString = JSON.stringify(userObject);

        // حفظ المستخدم بالبريد الإلكتروني
        await env.IONE_KV.put(`user:${normalizedEmail}`, userString);
        
        // حفظ المستخدم بكود الدخول السريع (لكي يعمل نظام تسجيل الدخول الجديد)
        await env.IONE_KV.put(`user:${normalizedCode}`, userString);

        return new Response(JSON.stringify({ success: true, message: 'تم إنشاء المستخدم بنجاح' }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'حدث خطأ: ' + error.message }), { status: 500, headers });
    }
}