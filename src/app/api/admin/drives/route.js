import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const drives = await RecruitmentDrive.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, drives });
  } catch (error) {
    console.error('Fetch Drives Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();

    const drive = await RecruitmentDrive.create(data);

    return NextResponse.json({ success: true, drive, message: 'Drive created successfully' });
  } catch (error) {
    console.error('Create Drive Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
