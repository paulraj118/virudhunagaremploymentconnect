import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if admin exists
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@12345', salt);
      
    if (admin) {
      await User.updateOne({ email: 'admin@gmail.com' }, { $set: { password: hashedPassword } });
      return NextResponse.json({ message: 'Admin password updated', email: 'admin@gmail.com', password: 'Admin@12345' });
    }

    // Create admin directly via Mongoose (now that hook is fixed)
    await User.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: 'Admin@12345',
      role: 'super_admin',
      mobile: '9999999999',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    });

    return NextResponse.json({
      message: 'Admin created successfully',
      email: 'admin@gmail.com',
      password: 'Admin@12345'
    });
  } catch (error) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
