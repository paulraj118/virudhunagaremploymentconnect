import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const {
      companyName,
      companyCode,
      hrName,
      hrEmail,
      mobileNumber,
      companyAddress,
      industry,
      companyWebsite,
      password
    } = await request.json();

    await dbConnect();

    const existingCompany = await Company.findOne({
      $or: [{ hrEmail }, { companyCode }]
    });

    if (existingCompany) {
      return NextResponse.json(
        { success: false, message: 'Company code or HR Email already exists' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCompany = await Company.create({
      companyName,
      companyCode,
      hrName,
      hrEmail,
      mobileNumber,
      companyAddress,
      industry,
      companyWebsite,
      password: hashedPassword,
      status: 'Pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Company registration submitted for Admin approval.',
    });
  } catch (error) {
    console.error('Company Registration Error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
