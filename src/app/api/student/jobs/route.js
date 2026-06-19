import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Job from '@/models/Job';
import Student from '@/models/Student';
import AssessmentResult from '@/models/AssessmentResult';
import { getCurrentUser } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/aiMatcher';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Assessment pass-gate: only students who passed can see jobs
    const passedAssessment = await AssessmentResult.findOne({ studentId: student._id, passFail: 'Pass' });
    if (!passedAssessment) {
      return NextResponse.json({
        success: true,
        jobs: [],
        gated: true,
        message: 'You must pass the assessment test to access job opportunities.'
      });
    }

    const allJobs = await Job.find({ isActive: true }).populate('companyId', 'companyName');

    // AI Job Recommendation: calculate match score for each job and sort them
    const recommendedJobs = allJobs.map(job => {
      const aiScores = calculateMatchScore(
        student.skills, 
        job.skills, 
        'Fresher', 
        job.experience
      );

      return {
        ...job._doc,
        aiMatchScore: aiScores.resumeScore,
        aiMissingSkills: aiScores.missingSkills
      };
    }).sort((a, b) => b.aiMatchScore - a.aiMatchScore); // Sort descending by AI match

    return NextResponse.json({
      success: true,
      jobs: recommendedJobs
    });

  } catch (error) {
    console.error('Fetch Student Jobs Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
