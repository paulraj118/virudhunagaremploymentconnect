import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoginOTP from '@/models/LoginOTP';
import { sendOTPEmail } from '@/lib/resendMail';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Delete any existing OTP for this email
    await LoginOTP.deleteMany({ email });

    // Generate new 6-digit OTP
    const otpPlain = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    const otpHashed = await bcrypt.hash(otpPlain, salt);

    // Store new OTP
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
      message: 'New OTP sent to your email',
    });
  } catch (error) {
    console.error('College OTP Resend Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
