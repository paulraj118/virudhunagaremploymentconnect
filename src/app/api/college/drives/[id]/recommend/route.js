import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DriveApplication from '@/models/DriveApplication';
import College from '@/models/College';
import Student from '@/models/Student';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import { getCurrentUser } from '@/lib/auth';
import { validateCollegeApproval } from '@/lib/collegeAuth';

export async function POST(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const approvalCheck = await validateCollegeApproval(decoded.id);
    if (!approvalCheck.success) {
      return NextResponse.json(
        { success: false, message: approvalCheck.message },
        { status: approvalCheck.status }
      );
    }

    await dbConnect();
    const { id } = await params;
    const { studentId } = await request.json();

    const college = authCheck.college;

    // Recommend a student for a drive by updating their application status or flag
    const app = await DriveApplication.findOneAndUpdate(
      { driveId: id, studentId, collegeName: college.collegeName },
      { $set: { recommendedByCollege: true } },
      { new: true }
    );

    if (!app) {
      // If application doesn't exist, they haven't applied. We could auto-apply them, but prompt says: 
      // "Student: View Drive Details -> Apply". So recommending an unapplied student should fail or auto-apply.
      // Let's assume recommend works only if applied, or we can upsert.
      return NextResponse.json({ success: false, message: 'Student has not applied to this drive yet' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Student recommended successfully' });
  } catch (error) {
    console.error('Recommend Student Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
