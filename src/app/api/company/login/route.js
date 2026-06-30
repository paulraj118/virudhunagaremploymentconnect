import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    if (rateLimiter(request, 5, 60000)) {
      return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const { email, password } = await request.json();
    await dbConnect();

    const company = await Company.findOne({ hrEmail: email });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    if (company.status !== 'Approved' && company.status !== 'Active') {
      return NextResponse.json(
        { success: false, message: `Account status is ${company.status}. Please contact Admin.` },
        { status: 403 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      {
        id: company._id.toString(),
        role: 'company',
        companyCode: company.companyCode
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      company: {
        id: company._id,
        companyName: company.companyName,
      }
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    // Prevent info leakage in response
    console.error('Company Login Error');
    return NextResponse.json({ success: false, message: 'Server error occurred during login' }, { status: 500 });
  }
}
