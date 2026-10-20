/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Logout API                                    */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    return new Response(JSON.stringify({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
    }), { status: 200, headers });
}