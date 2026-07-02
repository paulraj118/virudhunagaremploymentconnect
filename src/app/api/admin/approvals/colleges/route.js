import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const pendingColleges = await College.find({ approvalStatus: 'Pending' })
      .select('-password') // Ensure no password gets sent
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, pendingColleges });
  } catch (error) {
    console.error('Fetch Pending Colleges Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
