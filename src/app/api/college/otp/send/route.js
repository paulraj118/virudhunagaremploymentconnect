import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import LoginOTP from '@/models/LoginOTP';
import { sendOTPEmail } from '@/lib/resendMail';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

    // --- OTP flow for college ---
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
      role: 'college',
      otp: otpHashed,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
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
      role: 'college',
    });
  } catch (error) {
    console.error('College OTP Send Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
