import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DriveApplication from '@/models/DriveApplication';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    const applications = await DriveApplication.find({ studentId: student._id }).sort({ updatedAt: -1 }).lean();
    
    const driveIds = applications.map(app => app.driveId);
    const drives = await RecruitmentDrive.find({ _id: { $in: driveIds } }).lean();

    return NextResponse.json({ success: true, applications, drives });
  } catch (error) {
    console.error('Fetch Student Journey Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
