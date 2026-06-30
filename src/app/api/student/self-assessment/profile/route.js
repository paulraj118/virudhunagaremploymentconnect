import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: user.id });
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      currentYear,
      cgpa
    } = body;

    // Update student document with academic details only
    student.currentYear = currentYear || '';
    student.cgpa = cgpa ? Number(cgpa) : undefined;
    student.selfAssessmentProfileCompleted = true;

    await student.save();

    return NextResponse.json({
      success: true,
      message: 'Self Assessment Profile updated successfully',
      student: {
        selfAssessmentProfileCompleted: student.selfAssessmentProfileCompleted,
        currentYear: student.currentYear,
        cgpa: student.cgpa
      }
    });

  } catch (error) {
    console.error('Self Assessment Profile POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
