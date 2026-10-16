/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Verify Token API                              */
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
    
    try {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No token provided'
            }), { status: 401, headers });
        }
        
        const token = authHeader.substring(7);
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid or expired token'
            }), { status: 401, headers });
        }
        
        // Get fresh user data from KV
        const userRaw = await env.IONE_KV.get(`user:${payload.email}`);
        
        if (!userRaw) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), { status: 404, headers });
        }
        
        const user = JSON.parse(userRaw);
        
        if (!user.active) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Account disabled'
            }), { status: 403, headers });
        }
        
        return new Response(JSON.stringify({
            success: true,
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
            error: error.message
        }), { status: 500, headers });
    }
}

// ─────────────────────────────────────────────────────────────
// Verify JWT
// ─────────────────────────────────────────────────────────────
async function verifyToken(token, env) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
        const dataToSign = `${headerEncoded}.${payloadEncoded}`;
        
        const encoder = new TextEncoder();
        const secret = env.JWT_SECRET || 'ione_super_secret_2026';
        
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        
        // Decode signature
        const signatureBinary = atob(
            signatureEncoded.replace(/-/g, '+').replace(/_/g, '/')
        );
        const signature = new Uint8Array(signatureBinary.length);
        for (let i = 0; i < signatureBinary.length; i++) {
            signature[i] = signatureBinary.charCodeAt(i);
        }
        
        // Verify
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            encoder.encode(dataToSign)
        );
        
        if (!isValid) return null;
        
        // Decode payload
        const payloadBinary = atob(
            payloadEncoded.replace(/-/g, '+').replace(/_/g, '/')
        );
        const payload = JSON.parse(payloadBinary);
        
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        
        return payload;
        
    } catch (error) {
        return null;
    }
}