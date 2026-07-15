import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import LoginOTP from '@/models/LoginOTP';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendOTPEmail } from '@/lib/resendMail';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // --- Existing credential validation logic (unchanged) ---
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended' },
        { status: 403 }
      );
    }

    // --- Direct login for all roles (Bypass OTP) ---
    const token = signToken(user._id, user.role);

    const cookieStore = await cookies();
    cookieStore.set({
      name: `token_${user.role}`,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      directLogin: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
