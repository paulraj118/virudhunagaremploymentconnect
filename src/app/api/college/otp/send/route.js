import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import LoginOTP from '@/models/LoginOTP';
import { sendOTPEmail } from '@/lib/resendMail';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide an email and password' },
        { status: 400 }
      );
    }

    // --- Existing college credential validation logic (unchanged) ---
    const college = await College.findOne({ email }).select('+password');

    if (!college) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await college.matchPassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!college.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // --- Direct login for college (Bypass OTP) ---
    const token = signToken(college._id, 'college');

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      directLogin: true,
      token,
      user: {
        id: college._id,
        name: college.institutionName,
        email: college.email,
        role: 'college',
      },
    });
  } catch (error) {
    console.error('College OTP Send Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
