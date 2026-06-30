import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // Colleges only see Published drives
    const drives = await RecruitmentDrive.find({ status: 'Published' }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, drives });
  } catch (error) {
    console.error('Fetch College Drives Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
