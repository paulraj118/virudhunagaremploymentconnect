import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';
import { processAtsScore } from '@/lib/atsScorer';

export async function PUT(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      skills, 
      resumeUrl,
      collegeName,
      degree,
      department,
      yearOfPassedOut,
      yearsOfExperience,
      industryTrack,
      preferredDomain
    } = body;

    await dbConnect();
    
    const updateData = {};
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl;
    if (collegeName !== undefined) updateData.collegeName = collegeName;
    if (degree !== undefined) updateData.degree = degree;
    if (department !== undefined) updateData.department = department;
    if (yearOfPassedOut !== undefined) updateData.yearOfPassedOut = parseInt(yearOfPassedOut);
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = parseInt(yearsOfExperience || 0);
    if (industryTrack !== undefined) updateData.industryTrack = industryTrack;
    if (preferredDomain !== undefined) updateData.preferredDomain = preferredDomain;
    
    // Find the existing student first
    const existingStudent = await Student.findOne({ userId: decoded.id });
    if (!existingStudent) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Merge details to compute updated ATS scores
    const tempStudent = {
      ...existingStudent.toObject(),
      ...updateData
    };

    if (tempStudent.resumeUrl) {
      const { atsScore, resumeUrl: finalResumeUrl } = await processAtsScore(tempStudent);
      updateData.atsScore = atsScore;
      updateData.resumeUrl = finalResumeUrl;
    }

    const student = await Student.findOneAndUpdate(
      { userId: decoded.id },
      { $set: updateData },
      { new: true }
    );

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

