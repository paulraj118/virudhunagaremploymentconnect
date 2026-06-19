import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();
    
    const student = await Student.findByIdAndUpdate(
      id,
      { enrollmentStatus: status },
      { new: true }
    );

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student enrollment not found' }, { status: 404 });
    }

    // In a real app, you would trigger an email notification here based on status

    return NextResponse.json({
      success: true,
      message: `Enrollment successfully ${status}`,
      data: student
    });

  } catch (error) {
    console.error('Update Enrollment Status Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
