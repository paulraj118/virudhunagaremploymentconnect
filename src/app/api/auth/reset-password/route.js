import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Reset token is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    await dbConnect();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find account in User collection
    let account = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: new Date() }
    });
    let isCompanyModel = false;

    // If not found in User, check in Company
    if (!account) {
      account = await Company.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpire: { $gt: new Date() }
      });
      if (account) {
        isCompanyModel = true;
      }
    }

    if (!account) {
      return NextResponse.json({ success: false, message: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    // Set new password
    if (isCompanyModel) {
      // Company model doesn't have a pre-save hash hook, so hash manually
      const salt = await bcrypt.genSalt(10);
      account.password = await bcrypt.hash(password, salt);
    } else {
      // User model has a pre-save hook that checks isModified('password')
      account.password = password;
    }

    // Clear reset token and expiry
    account.resetPasswordToken = undefined;
    account.resetPasswordExpire = undefined;
    await account.save();

    console.log(`[AUTH] Password successfully reset for ${isCompanyModel ? 'Company' : 'User'} ID: ${account._id}`);

    return NextResponse.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
