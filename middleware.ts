import { NextRequest, NextResponse } from 'next/server';

// -------------------------------------------------------------
// РОЗДІЛ 1: RATE LIMITER (In-memory для Vercel Edge)
// -------------------------------------------------------------
const ipMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 50; // Толерантний ліміт (50 запитів) за хвилину
const WINDOW_MS = 60 * 1000; 

function handleRateLimit(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
               
    const now = Date.now();
    let ipData = ipMap.get(ip);
    
    // Скидаємо лічильник якщо вікно часу минуло
    if (!ipData || now - ipData.lastReset > WINDOW_MS) {
      ipData = { count: 1, lastReset: now };
    } else {
      ipData.count++;
    }
    ipMap.set(ip, ipData);

    // Якщо досягнуто ліміту - 429 Too Many Requests
    if (ipData.count > LIMIT) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too Many Requests', 
          message: 'Перевищено ліміт запитів до API. Спробуйте пізніше через 1 хвилину.' 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }
  }
  return null; 
}

// -------------------------------------------------------------
// РОЗДІЛ 2: ГОЛОВНИЙ MIDDLEWARE
// -------------------------------------------------------------
export function middleware(request: NextRequest) {
  
  // 1. Перевіряємо Rate Limit
  const rateLimitResponse = handleRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Створюємо відповідь для проходження далі
  const response = NextResponse.next();
  
  // 3. Security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-DNS-Prefetch-Control': 'off',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-{RANDOM}' cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' 'nonce-{RANDOM}' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' generativelanguage.googleapis.com",
      "frame-ancestors 'none'"
    ].join('; '),
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  };
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // CORS для /api/
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};