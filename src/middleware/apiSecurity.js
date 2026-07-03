import { NextResponse } from 'next/server';

// Simple in-memory store for rate limiting (Note: in serverless environments like Vercel, this resets frequently. For production, Redis is recommended).
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // max 100 requests per minute per IP

/**
 * Applies rate limiting to the incoming request based on IP address.
 * @param {string} ip - The client IP address.
 * @returns {boolean} - true if allowed, false if rate limit exceeded.
 */
function checkRateLimit(ip) {
  if (ip === 'unknown') return true; // Fallback if IP cannot be determined

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (now > record.resetTime) {
    // Window expired, reset
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Applies security headers to the given response object.
 * @param {NextResponse} response - The Next.js response object.
 */
function applySecurityHeaders(response) {
  // Helmet-style security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS Configuration
  response.headers.set('Access-Control-Allow-Origin', '*'); // Can be restricted to specific domains
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

/**
 * Higher-order function to wrap Next.js API route handlers with production-grade security.
 * @param {Function} handler - The original API route handler function.
 * @returns {Function} - The secured API route handler.
 */
export function withApiSecurity(handler) {
  return async (request, context) => {
    try {
      // 1. API Key Verification
      const apiKey = request.headers.get('x-api-key');
      const expectedApiKey = process.env.QUESTION_API_KEY;

      if (!expectedApiKey) {
        console.error('CRITICAL: QUESTION_API_KEY environment variable is not set on the server.');
        return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
      }

      if (!apiKey || apiKey !== expectedApiKey) {
        return NextResponse.json({ success: false, message: 'Unauthorized: Invalid or missing x-api-key' }, { status: 401 });
      }

      // 2. Rate Limiting
      const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
      if (!checkRateLimit(ip)) {
        return NextResponse.json({ success: false, message: 'Too many requests, please try again later.' }, { status: 429 });
      }

      // 3. Execute the actual handler
      const response = await handler(request, context);

      // Ensure the handler returned a valid response
      if (!(response instanceof Response)) {
         throw new Error('Handler must return a valid Response or NextResponse object');
      }

      // 4. Apply Security & CORS Headers
      applySecurityHeaders(response);

      return response;

    } catch (error) {
      // 5. Standardized Error Handling
      console.error('API Error:', error.message || error);
      
      // Do not expose internal server errors to the client
      const errorResponse = NextResponse.json(
        { success: false, message: 'Internal Server Error' },
        { status: 500 }
      );
      
      applySecurityHeaders(errorResponse);
      return errorResponse;
    }
  };
}
