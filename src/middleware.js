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

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const decodedPayload = await verifyJWT(token, JWT_SECRET);

    if (!decodedPayload || decodedPayload.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Optional: Redirect already authenticated super_admin away from /admin/login
  if (pathname === '/admin/login') {
    const token = request.cookies.get('token')?.value;
    if (token) {
      const decodedPayload = await verifyJWT(token, JWT_SECRET);
      if (decodedPayload && decodedPayload.role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
