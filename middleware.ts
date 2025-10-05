// middleware.ts - SECURITY MIDDLEWARE (create in root folder)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Security headers
  const securityHeaders = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Prevent DNS prefetching
    'X-DNS-Prefetch-Control': 'off',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'nonce-{RANDOM}' cdnjs.cloudflare.com",
      "style-src 'self' 'nonce-{RANDOM}' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' generativelanguage.googleapis.com",
      "frame-ancestors 'none'"
    ].join('; '),
    
    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()'
    ].join(', ')
  };
  
  // Set security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // API routes additional security
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Prevent caching of API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    // CORS headers for API
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};