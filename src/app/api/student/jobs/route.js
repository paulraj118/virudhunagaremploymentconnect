import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Job from '@/models/Job';
import Student from '@/models/Student';
import Company from '@/models/Company';
import JobApplication from '@/models/JobApplication';
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



    const allJobs = await Job.find({ isActive: true }).populate('companyId', 'companyName');
    
    // Fetch applications for this student to correctly flag hasApplied
    const studentApplications = await JobApplication.find({ studentId: student._id }).select('jobId');
    const appliedJobIds = studentApplications.map(app => app.jobId.toString());

    // Temporary logs for debugging Candidate Apply Now / Already Applied issue
    console.log(`[DEBUG] Candidate ID (Student ID): ${student._id}`);
    console.log(`[DEBUG] JobApplication query result size: ${studentApplications.length}`);
    console.log(`[DEBUG] Applied Job IDs: ${JSON.stringify(appliedJobIds)}`);

    // AI Job Recommendation: calculate match score for each job and sort them
    const recommendedJobs = allJobs.map(job => {
      const aiScores = calculateMatchScore(
        student.skills, 
        job.skills, 
        'Fresher', 
        job.experience
      );

      const hasApplied = appliedJobIds.includes(job._id.toString());
      console.log(`[DEBUG] Job ID: ${job._id}, hasApplied: ${hasApplied}`);

      return {
        ...job._doc,
        hasApplied,
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
