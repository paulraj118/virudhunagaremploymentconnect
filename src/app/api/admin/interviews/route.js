import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import Student from '@/models/Student';
import User from '@/models/User';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const interviews = await Interview.find()
      .populate({ path: 'studentId', select: 'userId collegeName', populate: { path: 'userId', model: User, select: 'name email' } })
      .populate('companyId', 'companyName')
      .populate('driveId', 'jobRole')
      .sort({ createdAt: -1 })
      .lean();

    const formattedInterviews = interviews.map(inv => ({
      ...inv,
      studentName: inv.studentId?.userId?.name || 'Unknown',
      collegeName: inv.studentId?.collegeName || 'Unknown',
    }));

    return NextResponse.json({ success: true, interviews: formattedInterviews });
  } catch (error) {
    console.error('Fetch Admin Interviews Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
