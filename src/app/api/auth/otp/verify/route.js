import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import LoginOTP from '@/models/LoginOTP';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and OTP' },
        { status: 400 }
      );
    }

    // Find the latest OTP record for this email
    const otpRecord = await LoginOTP.findOne({
      email,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await LoginOTP.deleteMany({ email });
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new one.', expired: true },
        { status: 400 }
      );
    }

    // Check max attempts
    if (otpRecord.attemptCount >= 3) {
      await LoginOTP.deleteMany({ email });
      return NextResponse.json(
        { success: false, message: 'Maximum attempts exceeded. Please login again.', maxAttempts: true },
        { status: 400 }
      );
    }

    // Verify OTP (bcrypt compare)
    const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOTPValid) {
      // Increment attempt count
      otpRecord.attemptCount += 1;
      await otpRecord.save();

      const remaining = 3 - otpRecord.attemptCount;
      return NextResponse.json(
        {
          success: false,
          message: remaining > 0
            ? `Invalid OTP. ${remaining} attempt(s) remaining.`
            : 'Maximum attempts exceeded. Please login again.',
          maxAttempts: remaining <= 0,
        },
        { status: 400 }
      );
    }

    // OTP is valid — mark as verified and delete
    await LoginOTP.deleteMany({ email });

    // Find the user and create session (existing logic)
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

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
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
