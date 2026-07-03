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

    // --- Admin bypass: Direct login without OTP ---
    if (user.role === 'super_admin') {
      const token = signToken(user._id, user.role);

      const cookieStore = await cookies();
      cookieStore.set({
        name: 'token',
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
    }

    // --- OTP flow for student / hr_company ---
    // Delete any existing OTP for this email
    await LoginOTP.deleteMany({ email });

    // Generate 6-digit OTP
    const otpPlain = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing
    const salt = await bcrypt.genSalt(10);
    const otpHashed = await bcrypt.hash(otpPlain, salt);

    // Store OTP in MongoDB
    await LoginOTP.create({
      email,
      role: user.role,
      otp: otpHashed,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      verified: false,
      attemptCount: 0,
    });

    // Send OTP via Resend
    const emailResult = await sendOTPEmail(email, otpPlain);
    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      otpRequired: true,
      message: 'OTP sent to your registered email',
      email,
      role: user.role,
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
