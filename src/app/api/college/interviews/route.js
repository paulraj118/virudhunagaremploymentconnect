import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import User from '@/models/User';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // Get all students for this college
    const students = await Student.find({ collegeName: decoded.collegeName }).select('_id userId');
    const studentIds = students.map(s => s._id);

    const interviews = await Interview.find({ studentId: { $in: studentIds } })
      .populate({ path: 'studentId', select: 'userId degree department', populate: { path: 'userId', model: User, select: 'name email' } })
      .populate('companyId', 'companyName')
      .populate('driveId', 'jobRole')
      .sort({ date: 1 })
      .lean();

    const formattedInterviews = interviews.map(inv => ({
      ...inv,
      studentName: inv.studentId?.userId?.name || 'Unknown',
      studentEmail: inv.studentId?.userId?.email || 'Unknown',
      degree: inv.studentId?.degree,
      department: inv.studentId?.department,
    }));

    return NextResponse.json({ success: true, interviews: formattedInterviews });
  } catch (error) {
    console.error('Fetch College Interviews Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
