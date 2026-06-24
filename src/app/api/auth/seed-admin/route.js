import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await dbConnect();

    const adminEmail = 'admin@jobfair.com';
    const adminPassword = 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: "Admin user already exists in this exact database!", 
        database: mongoose.connection.name 
      }, { status: 200 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      mobile: '9999999999',
      role: 'super_admin',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    });

    return NextResponse.json({ 
      success: true, 
      message: "Admin user created successfully inside Vercel's database!",
      email: adminEmail,
      password: adminPassword
    }, { status: 201 });

  } catch (error) {
    console.error("Error seeding admin:", error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
