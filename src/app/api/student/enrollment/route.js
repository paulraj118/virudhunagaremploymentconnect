import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check if student already enrolled
    const existingStudent = await Student.findOne({ userId: decoded.id });
    if (existingStudent) {
      return NextResponse.json({ success: false, message: 'You have already enrolled' }, { status: 400 });
    }

    const body = await request.json();
    const { collegeName, degree, department, yearOfPassedOut, yearsOfExperience, skills, preferredDomain, industryTrack, resumeUrl } = body;

    if (!collegeName || !degree || !department || !yearOfPassedOut || !preferredDomain || !industryTrack) {
      return NextResponse.json({ success: false, message: 'Please provide all required fields including IT/NON-IT track' }, { status: 400 });
    }

    const student = await Student.create({
      userId: decoded.id,
      collegeName,
      degree,
      department,
      yearOfPassedOut: parseInt(yearOfPassedOut),
      yearsOfExperience: parseInt(yearsOfExperience || 0),
      skills,
      preferredDomain,
      industryTrack,
      resumeUrl,
      enrollmentStatus: 'pending' // As per workflow
    });

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully. Pending Admin Approval.',
      student
    }, { status: 201 });

  } catch (error) {
    console.error('Enrollment Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const student = await Student.findOne({ userId: decoded.id }).populate('userId', 'name email mobile');
    
    if (!student) {
      return NextResponse.json({ success: true, enrolled: false });
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      student
    });

  } catch (error) {
    console.error('Fetch Enrollment Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
