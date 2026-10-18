/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Setup: Create First CEO User                  */
/*  ⚠️ يُستخدم مرة واحدة فقط — احذفه بعد الاستخدام!            */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    // Only allow POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ 
            error: 'Method not allowed' 
        }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        // بيانات CEO
        const ceoData = {
            username: 'khalilceo',
            email: 'khalilceo@ione.com',
            password: 'IONE_CEO_2026_StrongPass', // ← غيّرها لاحقاً!
            role: 'ceo',
            full_name: 'Khalil - CEO',
            permissions: ['*'], // كل الصلاحيات
            active: true,
            created_at: new Date().toISOString(),
            created_by: 'setup'
        };
        
        // تشفير كلمة المرور (نستخدم Simple Hash مؤقتاً)
        // ⚠️ في الإنتاج: استخدم bcrypt
        const passwordHash = await hashPassword(ceoData.password);
        
        // الحفظ في KV
        const userKey = `user:${ceoData.email}`;
        const userToStore = {
            ...ceoData,
            password: undefined, // لا نحفظ كلمة المرور
            password_hash: passwordHash
        };
        
        await env.IONE_KV.put(userKey, JSON.stringify(userToStore));
        
        // إضافة إلى قائمة المستخدمين
        const usersListRaw = await env.IONE_KV.get('users:list');
        const usersList = usersListRaw ? JSON.parse(usersListRaw) : [];
        
        if (!usersList.includes(ceoData.email)) {
            usersList.push(ceoData.email);
            await env.IONE_KV.put('users:list', JSON.stringify(usersList));
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'CEO user created successfully',
            user: {
                username: ceoData.username,
                email: ceoData.email,
                role: ceoData.role
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ─────────────────────────────────────────────────────────────
// Helper: Hash Password (Simple)
// ⚠️ مؤقت — للإنتاج استخدم bcrypt
// ─────────────────────────────────────────────────────────────
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_IONE_SALT_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}