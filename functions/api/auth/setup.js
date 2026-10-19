export async function onRequest(context) {
    const { env } = context;
    const headers = { 'Content-Type': 'application/json' };

    try {
        const email = 'khalil@ione.com';
        const password = '665218'; // كلمة المرور الجديدة
        const userCode = '1'; // كود الدخول

        const encoder = new TextEncoder();
        const data = encoder.encode(password + '_IONE_SALT_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const userObject = {
            email: email,
            full_name: 'Khalil - CEO',
            password_hash: password_hash,
            role: 'ceo',
            permissions: ['admin', '*'],
            active: true,
            userCode: userCode,
            created_at: new Date().toISOString()
        };

        const userString = JSON.stringify(userObject);

        // حفظ المستخدم بالبريد الإلكتروني
        await env.IONE_KV.put(`user:${email}`, userString);
        // حفظ المستخدم بكود الدخول السريع (هذا ما سيسمح لك بالدخول بـ 1)
        await env.IONE_KV.put(`user:${userCode}`, userString);

        return new Response(JSON.stringify({ success: true, message: 'تم إنشاء المستخدم بنجاح' }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}