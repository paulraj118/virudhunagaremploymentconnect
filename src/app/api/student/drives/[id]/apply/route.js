import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DriveApplication from '@/models/DriveApplication';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const { action } = await request.json(); // "apply" or "withdraw"
    
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (action === 'apply') {
      await DriveApplication.updateOne(
        { driveId: id, studentId: student._id },
        { $set: { driveId: id, studentId: student._id, collegeName: student.collegeName || 'Unknown', status: 'Applied' } },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: 'Applied successfully' });
    } else if (action === 'withdraw') {
      await DriveApplication.deleteOne({ driveId: id, studentId: student._id });
      return NextResponse.json({ success: true, message: 'Application withdrawn' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Student Apply Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
