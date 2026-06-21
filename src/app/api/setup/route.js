import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if admin exists
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (admin) {
      // Force direct update via Mongoose to bypass any hooks
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@12345', salt);
      
      await User.updateOne({ email: 'admin@gmail.com' }, { $set: { password: hashedPassword } });
      
      return NextResponse.json({ message: 'Admin password FORCED reset', email: 'admin@gmail.com', password: 'Admin@12345' });
    }

    return NextResponse.json({ message: 'Admin not found!' });
  } catch (error) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
