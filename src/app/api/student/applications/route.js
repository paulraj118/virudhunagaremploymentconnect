import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import Student from '@/models/Student';
import Job from '@/models/Job';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    const applications = await JobApplication.find({ studentId: student._id })
      .populate('jobId')
      .populate('companyId', 'companyName hrName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      applications,
      assessmentScore: student.assessmentScore || 0
    });

  } catch (error) {
    console.error('Fetch Student Applications Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
