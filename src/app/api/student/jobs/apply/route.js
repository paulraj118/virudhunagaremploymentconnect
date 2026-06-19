import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import Job from '@/models/Job';
import Student from '@/models/Student';
import AssessmentResult from '@/models/AssessmentResult';
import { getCurrentUser } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/aiMatcher';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await request.json();

    await dbConnect();
    
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Assessment pass-gate: only students who passed can apply
    const passedAssessment = await AssessmentResult.findOne({ studentId: student._id, passFail: 'Pass' });
    if (!passedAssessment) {
      return NextResponse.json({ success: false, message: 'You must pass the assessment test to apply for jobs.' }, { status: 403 });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    // Check if already applied
    const existing = await JobApplication.findOne({ studentId: student._id, jobId: job._id });
    if (existing) {
      return NextResponse.json({ success: false, message: 'You have already applied for this job' }, { status: 400 });
    }

    // Run AI Resume Screening
    const aiScores = calculateMatchScore(
      student.skills, 
      job.skills, 
      'Fresher', // Student experience mapping
      job.experience
    );

    const application = await JobApplication.create({
      jobId: job._id,
      companyId: job.companyId,
      studentId: student._id,
      stage: 'Applied',
      aiResumeScore: aiScores.resumeScore,
      aiSkillMatch: aiScores.skillMatchPercentage,
      aiExperienceMatch: aiScores.experienceMatchPercentage,
      missingSkills: aiScores.missingSkills
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully applied for the job. AI Score calculated.',
      application
    }, { status: 201 });

  } catch (error) {
    console.error('Job Application Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
