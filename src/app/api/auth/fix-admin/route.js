import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();

    const adminEmail = 'admin@jobfair.com';
    const plainPassword = 'Admin@123';

    // Fix double-hashed password
    const salt = await bcrypt.genSalt(10);
    const correctHashedPassword = await bcrypt.hash(plainPassword, salt);

    // Use updateOne to bypass the pre-save hook that was causing the double-hash
    await User.updateOne(
      { email: adminEmail },
      { $set: { password: correctHashedPassword } }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Admin password successfully fixed! The double-hash issue is resolved.",
      email: adminEmail,
      password: plainPassword
    }, { status: 200 });

  } catch (error) {
    console.error("Error fixing admin:", error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
