import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Sanitize: strip HTML tags
const sanitize = (str) => String(str).replace(/[<>]/g, '').trim();

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    let { name, email, password, mobile, role } = body;

    if (!name || !email || !password || !mobile || !role) {
      return NextResponse.json({ success: false, message: 'Please provide all required fields' }, { status: 400 });
    }

    // --- Sanitize & normalize ---
    name = sanitize(name);
    email = sanitize(email).toLowerCase();
    mobile = sanitize(mobile);
    // Password is not sanitized to allow special characters

    // --- Validate Name ---
    if (name.length < 3) {
      return NextResponse.json({ success: false, message: 'Full Name must be at least 3 characters' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ success: false, message: 'Full Name cannot exceed 50 characters' }, { status: 400 });
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return NextResponse.json({ success: false, message: 'Full Name must contain only letters and spaces' }, { status: 400 });
    }

    // --- Validate Mobile ---
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Enter a valid 10-digit mobile number' }, { status: 400 });
    }
    if (!/^[6-9]/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Mobile number must start with 6, 7, 8, or 9' }, { status: 400 });
    }

    // --- Validate Email ---
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address' }, { status: 400 });
    }

    // --- Validate Password ---
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (password.length > 20) {
      return NextResponse.json({ success: false, message: 'Password cannot exceed 20 characters' }, { status: 400 });
    }
    if (/\s/.test(password)) {
      return NextResponse.json({ success: false, message: 'Password must not contain spaces' }, { status: 400 });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ success: false, message: 'Password must contain uppercase, lowercase, number, and special character' }, { status: 400 });
    }

    // --- Validate Role ---
    if (!['student', 'hr_company'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role selected' }, { status: 400 });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    const user = await User.create({
      name,
      email,
      password,
      mobile,
      role
    });

    const token = signToken(user._id, user.role);

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

