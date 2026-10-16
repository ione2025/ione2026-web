/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Update User API                               */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false,
            error: 'Method not allowed'
        }), { status: 405, headers });
    }
    
    try {
        // Verify CEO
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No token'
            }), { status: 401, headers });
        }
        
        const payload = await verifyToken(authHeader.substring(7), env);
        
        if (!payload) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token'
            }), { status: 401, headers });
        }
        
        const isCEO = payload.role === 'ceo' || 
                      (payload.permissions && payload.permissions.includes('*'));
        
        if (!isCEO) {
            return new Response(JSON.stringify({
                success: false,
                error: 'CEO only'
            }), { status: 403, headers });
        }
        
        const body = await request.json();
        const { email, password, full_name, role, permissions, active } = body;
        
        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email required'
            }), { status: 400, headers });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const userKey = `user:${normalizedEmail}`;
        
        // Get existing user
        const userRaw = await env.IONE_KV.get(userKey);
        if (!userRaw) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), { status: 404, headers });
        }
        
        const user = JSON.parse(userRaw);
        
        // Prevent modifying CEO by others
        if (user.role === 'ceo' && payload.email !== normalizedEmail) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Cannot modify CEO'
            }), { status: 403, headers });
        }
        
        // Update fields
        if (full_name !== undefined) user.full_name = full_name;
        if (role !== undefined) user.role = role;
        if (permissions !== undefined) user.permissions = permissions;
        if (active !== undefined) user.active = active;
        if (password) {
            user.password_hash = await hashPassword(password);
        }
        
        user.updated_at = new Date().toISOString();
        user.updated_by = payload.email;
        
        // Save
        await env.IONE_KV.put(userKey, JSON.stringify(user));
        
        // Remove password from response
        delete user.password_hash;
        
        return new Response(JSON.stringify({
            success: true,
            message: 'تم تحديث المستخدم',
            user
        }), { status: 200, headers });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
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
        const [h, p, s] = parts;
        const data = `${h}.${p}`;
        const encoder = new TextEncoder();
        const secret = env.JWT_SECRET || 'ione_super_secret_2026';
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const sigBin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const sig = new Uint8Array(sigBin.length);
        for (let i = 0; i < sigBin.length; i++) sig[i] = sigBin.charCodeAt(i);
        const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data));
        if (!valid) return null;
        const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (e) { return null; }
}