import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Check if admin exists
    let admin = await collection.findOne({ email: 'admin@gmail.com' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@12345', salt);
      
    if (admin) {
      await collection.updateOne({ email: 'admin@gmail.com' }, { $set: { password: hashedPassword, role: 'super_admin' } });
      return NextResponse.json({ message: 'Admin password updated via raw query', email: 'admin@gmail.com', password: 'Admin@12345' });
    }

    await collection.insertOne({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'super_admin',
      mobile: '9999999999',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      message: 'Admin created successfully via raw query',
      email: 'admin@gmail.com',
      password: 'Admin@12345'
    });
  } catch (error) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
