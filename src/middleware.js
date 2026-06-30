import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

// Edge-native Web Crypto API to verify JWT signature (HMAC SHA-256)
async function verifyJWT(token, secret) {
  try {
    if (!secret) {
      console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Convert base64url to base64
    const toBase64 = (str) => str.replace(/-/g, '+').replace(/_/g, '/');
    
    const enc = new TextEncoder();
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert signature back to bytes
    const signatureString = atob(toBase64(signatureB64));
    const signatureBytes = new Uint8Array(signatureString.length);
    for (let i = 0; i < signatureString.length; i++) {
      signatureBytes[i] = signatureString.charCodeAt(i);
    }
    
    // Prepare the data to be verified (header.payload)
    const dataBytes = enc.encode(`${headerB64}.${payloadB64}`);

    // Verify
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataBytes);
    
    if (isValid) {
      const payloadString = atob(toBase64(payloadB64));
      const payload = JSON.parse(payloadString);
      
      // Enforce Expiration
      if (payload.exp) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp >= payload.exp) {
          console.warn('JWT Token has expired.');
          return null;
        }
      }
      
      return payload;
    }
    
    return null;
  } catch (error) {
    console.error('JWT Verification Error in Middleware:', error);
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('token')?.value;
  let decodedPayload = null;
  if (token) {
    decodedPayload = await verifyJWT(token, JWT_SECRET);
  }

  // Admin Protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!decodedPayload || decodedPayload.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  if (pathname === '/admin/login' && decodedPayload?.role === 'super_admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Student Protection
  if (pathname.startsWith('/student') && !pathname.startsWith('/student/login') && !pathname.startsWith('/student/register')) {
    if (!decodedPayload || decodedPayload.role !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Company Protection
  if (pathname.startsWith('/company') && !pathname.startsWith('/company/login') && !pathname.startsWith('/company/register')) {
    // Both 'company' (standalone) and 'hr_company' (unified user)
    if (!decodedPayload || (decodedPayload.role !== 'company' && decodedPayload.role !== 'hr_company')) {
      return NextResponse.redirect(new URL('/company/login', request.url));
    }
  }

  // College Protection
  if (pathname.startsWith('/college') && !pathname.startsWith('/college/login') && !pathname.startsWith('/college/register')) {
    if (!decodedPayload || decodedPayload.role !== 'college') {
      return NextResponse.redirect(new URL('/college/login', request.url));
    }
  }

  // Redirect authenticated users away from unified or specific login pages
  const isLoginPage = pathname === '/login' || pathname.endsWith('/login');
  if (isLoginPage && decodedPayload) {
    if (decodedPayload.role === 'super_admin' && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (decodedPayload.role === 'student' && !pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/student/jobs', request.url));
    }
    if ((decodedPayload.role === 'company' || decodedPayload.role === 'hr_company') && !pathname.startsWith('/company')) {
      return NextResponse.redirect(new URL('/company', request.url));
    }
    if (decodedPayload.role === 'college' && !pathname.startsWith('/college')) {
      return NextResponse.redirect(new URL('/college/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/company/:path*', '/college/:path*', '/login'],
};
