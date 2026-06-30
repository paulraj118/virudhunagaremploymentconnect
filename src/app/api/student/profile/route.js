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
      preferredDomain,
      cgpa,
      currentPercentage,
      tenthPercentage,
      twelfthPercentage,
      currentYear,
      currentSemester,
      activeArrears,
      clearedArrears
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
    
    // Academic fields
    if (cgpa !== undefined) updateData.cgpa = cgpa;
    if (currentPercentage !== undefined) updateData.currentPercentage = currentPercentage;
    if (tenthPercentage !== undefined) updateData.tenthPercentage = tenthPercentage;
    if (twelfthPercentage !== undefined) updateData.twelfthPercentage = twelfthPercentage;
    if (currentYear !== undefined) updateData.currentYear = currentYear;
    if (currentSemester !== undefined) updateData.currentSemester = currentSemester;
    if (activeArrears !== undefined) updateData.activeArrears = activeArrears;
    if (clearedArrears !== undefined) updateData.clearedArrears = clearedArrears;
    
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

