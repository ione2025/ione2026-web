/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Login API                                     */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    // CORS Headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Handle OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    // Only POST allowed
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ 
            error: 'Method not allowed' 
        }), { status: 405, headers });
    }
    
    try {
        const body = await request.json();
        // استقبال userCode بدلاً من email فقط
        const { userCode, password } = body;
        
        // Validation
        if (!userCode || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: 'كود الدخول وكلمة المرور مطلوبان'
            }), { status: 400, headers });
        }
        
        // Normalize userCode (تحويل الحروف إلى صغيرة وإزالة المسافات)
        const normalizedCode = userCode.toLowerCase().trim();
        
        // Get user from KV
        // البحث سيكون بمفتاح مثل user:emp-1001 أو user:khalilceo@ione.com
        const userKey = `user:${normalizedCode}`;
        const userRaw = await env.IONE_KV.get(userKey);
        
        if (!userRaw) {
            return new Response(JSON.stringify({
                success: false,
                error: 'كود الدخول أو كلمة المرور غير صحيحة'
            }), { status: 401, headers });
        }
        
        const user = JSON.parse(userRaw);
        
        // Check if user is active
        if (!user.active) {
            return new Response(JSON.stringify({
                success: false,
                error: 'الحساب معطّل. تواصل مع المدير'
            }), { status: 403, headers });
        }
        
        // Verify password
        const passwordHash = await hashPassword(password);
        
        if (passwordHash !== user.password_hash) {
            return new Response(JSON.stringify({
                success: false,
                error: 'كود الدخول أو كلمة المرور غير صحيحة'
            }), { status: 401, headers });
        }
        
        // Create JWT token
        const token = await createToken({
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        }, env);
        
        // Update last login
        user.last_login = new Date().toISOString();
        await env.IONE_KV.put(userKey, JSON.stringify(user));
        
        // Return success
        return new Response(JSON.stringify({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                email: user.email,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                permissions: user.permissions
            }
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'حدث خطأ: ' + error.message
        }), { status: 500, headers });
    }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_IONE_SALT_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createToken(payload, env) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + (7 * 24 * 60 * 60) // 7 days
    };
    
    const encoder = new TextEncoder();
    
    const base64UrlEncode = (obj) => {
        const str = JSON.stringify(obj);
        const bytes = encoder.encode(str);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };
    
    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(fullPayload);
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;
    
    const secret = env.JWT_SECRET || 'ione_super_secret_2026';
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(dataToSign)
    );
    
    const signatureArray = Array.from(new Uint8Array(signature));
    let signatureBinary = '';
    signatureArray.forEach(b => signatureBinary += String.fromCharCode(b));
    const signatureEncoded = btoa(signatureBinary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    return `${dataToSign}.${signatureEncoded}`;
}