import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { COLLEGES } from '@/lib/collegeConstants';

export async function POST(request) {
  try {
    await dbConnect();
    const rawData = await request.json();

    // Trim and sanitize inputs
    const data = {
      collegeName: (rawData.collegeName || '').trim(),
      collegeCode: (rawData.collegeCode || '').trim().toUpperCase(),
      contactPerson: (rawData.contactPerson || '').trim(),
      email: (rawData.email || '').trim().toLowerCase(),
      mobile: (rawData.mobile || '').trim(),
      address: (rawData.address || '').trim(),
      district: (rawData.district || '').trim(),
      state: (rawData.state || '').trim(),
      password: rawData.password || '', // Don't trim password
    };

    const { collegeName, collegeCode, contactPerson, email, mobile, address, district, state, password } = data;

    // Strict validation
    const isFromList = COLLEGES.some(c => c.toLowerCase() === collegeName.toLowerCase());
    if (!collegeName || collegeName.length < 3 || collegeName.length > 100 || / {2,}/.test(collegeName) || (!isFromList && !/^[A-Za-z0-9&.\-()', ]+$/.test(collegeName))) {
      return NextResponse.json({ success: false, message: 'Invalid College Name.' }, { status: 400 });
    }
    
    if (!collegeCode || collegeCode.length < 3 || collegeCode.length > 20 || !/^[A-Z0-9]+$/.test(collegeCode)) {
      return NextResponse.json({ success: false, message: 'Invalid College Code.' }, { status: 400 });
    }

    if (!contactPerson || contactPerson.length < 3 || contactPerson.length > 60 || !/^[A-Za-z ]+$/.test(contactPerson)) {
      return NextResponse.json({ success: false, message: 'Enter a valid Contact Person name.' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid Email Address.' }, { status: 400 });
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Enter a valid Mobile Number.' }, { status: 400 });
    }

    if (!address || address.length < 10 || address.length > 250) {
      return NextResponse.json({ success: false, message: 'Address must be between 10 and 250 characters.' }, { status: 400 });
    }

    if (!district || district.length < 3 || !/^[A-Za-z ]+$/.test(district)) {
      return NextResponse.json({ success: false, message: 'District must contain at least 3 characters and alphabets only.' }, { status: 400 });
    }

    if (!state || state.length < 3 || !/^[A-Za-z ]+$/.test(state)) {
      return NextResponse.json({ success: false, message: 'State must contain at least 3 characters and alphabets only.' }, { status: 400 });
    }

    if (!password || password.length < 8 || password.length > 32 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password)) {
      return NextResponse.json({ success: false, message: 'Password must contain uppercase, lowercase, number, and special character.' }, { status: 400 });
    }

    // Check existing
    const existingEmail = await College.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
    }
    const existingCode = await College.findOne({ collegeCode });
    if (existingCode) {
      return NextResponse.json({ success: false, message: 'College Code already exists.' }, { status: 400 });
    }

    // Only pass validated fields to create, preventing NoSQL injection via unknown fields
    const college = await College.create(data);

    // Create token
    const token = signToken(college._id, 'college');
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'College Registration Successful.' });

  } catch (error) {
    console.error('College Register Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
