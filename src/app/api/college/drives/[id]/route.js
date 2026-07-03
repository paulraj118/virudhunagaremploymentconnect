import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { validateCollegeApproval } = await import('@/lib/collegeAuth');
    const authCheck = await validateCollegeApproval(decoded.id);
    if (!authCheck.success) {
      return NextResponse.json(authCheck, { status: authCheck.status });
    }

    await dbConnect();
    const college = authCheck.college;
    const { id } = await params;
    const { status } = await request.json();

    const drive = await RecruitmentDrive.findById(id);
    if (!drive) {
      return NextResponse.json({ success: false, message: 'Drive not found' }, { status: 404 });
    }

    // A college can only update its own drives
    if (drive.createdBy !== college.collegeName) {
      return NextResponse.json({ success: false, message: 'Forbidden. You do not own this drive.' }, { status: 403 });
    }

    drive.status = status;
    await drive.save();

    return NextResponse.json({ success: true, message: 'Drive updated successfully', drive });
  } catch (error) {
    console.error('Update College Drive Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { validateCollegeApproval } = await import('@/lib/collegeAuth');
    const authCheck = await validateCollegeApproval(decoded.id);
    if (!authCheck.success) {
      return NextResponse.json(authCheck, { status: authCheck.status });
    }

    await dbConnect();
    const college = authCheck.college;
    const { id } = await params;

    const drive = await RecruitmentDrive.findById(id);
    if (!drive) {
      return NextResponse.json({ success: false, message: 'Drive not found' }, { status: 404 });
    }

    // A college can only delete its own drives
    if (drive.createdBy !== college.collegeName) {
      return NextResponse.json({ success: false, message: 'Forbidden. You do not own this drive.' }, { status: 403 });
    }

    await RecruitmentDrive.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Drive deleted successfully' });
  } catch (error) {
    console.error('Delete College Drive Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
