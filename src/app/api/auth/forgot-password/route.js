import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import crypto from 'crypto';
import { rateLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    if (rateLimiter(request, 3, 60000)) {
      return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { email } = await request.json();
    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    }

    await dbConnect();

    let account = await User.findOne({ email });
    let isCompanyModel = false;

    if (!account) {
      account = await Company.findOne({ hrEmail: email });
      if (account) {
        isCompanyModel = true;
      }
    }

    const genericResponse = { 
      success: true, 
      message: 'If the email is registered, a password reset link will be sent shortly.' 
    };

    if (!account) {
      return NextResponse.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = now + 15 * 60 * 1000;

    account.resetPasswordToken = tokenHash;
    account.resetPasswordExpire = new Date(tokenExpiry);
    await account.save();

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    console.log(`[MOCK EMAIL SERVICE] Password Reset URL generated successfully`);

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
