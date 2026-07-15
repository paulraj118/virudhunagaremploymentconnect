import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: `token_${decoded.role}`,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore Token Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
