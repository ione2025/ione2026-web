/* ═══════════════════════════════════════════════════════════ */
/*  IONECENTER — Create User API (Final Fix)                   */
/* ═══════════════════════════════════════════════════════════ */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    // التعامل مع طلبات OPTIONS (CORS Preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    // رفض أي طلب ليس POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false,
            error: 'Method not allowed'
        }), { status: 405, headers });
    }
    
    try {
        // ... (باقي الكود كما هو: التحقق من التوكن، حفظ البيانات في KV، إلخ)
        // تأكد من نسخ الكود الكامل الذي أرسلته لك سابقاً هنا
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}