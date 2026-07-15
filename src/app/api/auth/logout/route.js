import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  const { role } = await request.json().catch(() => ({}));
  const cookieName = role ? `token_${role}` : 'token';
  
  const cookieStore = await cookies();
  cookieStore.set({
    name: cookieName,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
