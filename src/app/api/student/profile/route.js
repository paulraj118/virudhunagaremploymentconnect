import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skills, resumeUrl } = body;

    await dbConnect();
    
    const student = await Student.findOneAndUpdate(
      { userId: decoded.id },
      { 
        ...(skills && { skills: skills.split(',').map(s => s.trim()).filter(Boolean) }),
        ...(resumeUrl && { resumeUrl })
      },
      { new: true }
    );

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      student
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
