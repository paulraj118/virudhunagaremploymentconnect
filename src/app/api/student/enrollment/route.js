import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import AssessmentResult from '@/models/AssessmentResult';
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
      enrollmentStatus: 'approved'
    });

    // Calculate ATS Score now that we have the full profile
    try {
      const { processAtsScore } = require('@/lib/atsScorer');
      const { atsScore, resumeUrl: finalResumeUrl } = await processAtsScore(student);
      
      student.atsScore = atsScore;
      student.resumeUrl = finalResumeUrl;
      await student.save();
    } catch (err) {
      console.error('Error calculating ATS score during enrollment:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully.',
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

    const assessments = await AssessmentResult.find({ studentId: student._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      enrolled: true,
      student,
      assessments
    });

  } catch (error) {
    console.error('Fetch Enrollment Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
