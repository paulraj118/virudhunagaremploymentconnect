import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch all enrollments with user details
    const enrollments = await Student.find().populate('userId', 'name email mobile').sort({ createdAt: -1 });

    // Calculate stats for Dashboard
    const totalEnrollments = enrollments.length;
    const activeStudents = enrollments.filter(e => e.enrollmentStatus === 'approved').length;
    const pendingApprovals = enrollments.filter(e => e.enrollmentStatus === 'pending').length;

    return NextResponse.json({
      success: true,
      data: enrollments,
      stats: {
        totalEnrollments,
        activeStudents,
        pendingApprovals
      }
    });

  } catch (error) {
    console.error('Fetch Admin Enrollments Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
