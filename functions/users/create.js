export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    // 1. التعامل مع طلبات OPTIONS (CORS) التي يرسلها المتصفح تلقائياً
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    // 2. رفض أي طلب ليس POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
    }
    
    try {
        // 3. التحقق من التوكن
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'No token provided' }), { status: 401, headers });
        }
        
        const payload = await verifyToken(authHeader.substring(7), env);
        if (!payload) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), { status: 401, headers });
        }
        
        // 4. استقبال البيانات (تمت إضافة phone و userCode و avatar)
        const body = await request.json();
        const { email, password, full_name, phone, userCode, avatar, role, permissions, active } = body;
        
        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, error: 'البريد وكلمة المرور مطلوبان' }), { status: 400, headers });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // 5. التحقق من وجود المستخدم مسبقاً
        const existing = await env.IONE_KV.get(`user:${normalizedEmail}`);
        if (existing) {
            return new Response(JSON.stringify({ success: false, error: 'البريد مستخدم بالفعل' }), { status: 409, headers });
        }
        
        // 6. إنشاء المستخدم
        const passwordHash = await hashPassword(password);
        const username = normalizedEmail.split('@')[0];
        
        const newUser = {
            username,
            email: normalizedEmail,
            password_hash: passwordHash,
            full_name: full_name || username,
            phone: phone || '',
            userCode: userCode || '',
            avatar: avatar || '',
            role: role || 'operator',
            permissions: permissions || [],
            active: active !== false,
            created_at: new Date().toISOString(),
            created_by: payload.email,
            last_login: null
        };
        
        // 7. الحفظ في قاعدة البيانات
        await env.IONE_KV.put(`user:${normalizedEmail}`, JSON.stringify(newUser));
        
        // 8. إضافة المستخدم لقائمة المستخدمين
        const usersListRaw = await env.IONE_KV.get('users:list');
        const usersList = usersListRaw ? JSON.parse(usersListRaw) : [];
        
        if (!usersList.includes(normalizedEmail)) {
            usersList.push(normalizedEmail);
            await env.IONE_KV.put('users:list', JSON.stringify(usersList));
        }
        
        delete newUser.password_hash;
        
        return new Response(JSON.stringify({ success: true, message: 'تم إنشاء المستخدم بنجاح', user: newUser }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_IONE_SALT_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(token, env) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
        const dataToSign = `${headerEncoded}.${payloadEncoded}`;
        const encoder = new TextEncoder();
        const secret = env.JWT_SECRET || 'ione_super_secret_2026';
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const signatureBinary = atob(signatureEncoded.replace(/-/g, '+').replace(/_/g, '/'));
        const signature = new Uint8Array(signatureBinary.length);
        for (let i = 0; i < signatureBinary.length; i++) signature[i] = signatureBinary.charCodeAt(i);
        const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(dataToSign));
        if (!isValid) return null;
        const payloadBinary = atob(payloadEncoded.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadBinary);
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (error) {
        return null;
    }
}