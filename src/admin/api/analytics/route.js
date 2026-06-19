import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Company from '@/models/Company';
import Job from '@/models/Job';
import JobApplication from '@/models/JobApplication';
import AssessmentResult from '@/models/AssessmentResult';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Run aggregations in parallel
    const [
      totalStudents,
      totalCompanies,
      totalJobs,
      totalAssessments,
      totalApplications,
      placements
    ] = await Promise.all([
      Student.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      AssessmentResult.countDocuments(),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({ stage: 'Joined' }) // "Joined" means placement completed
    ]);

    // Pass percentage calculation
    const passedAssessments = await AssessmentResult.countDocuments({ passFail: 'Pass' });
    const passPercentage = totalAssessments > 0 
      ? Math.round((passedAssessments / totalAssessments) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalJobs,
        totalAssessments,
        totalApplications,
        totalPlacements: placements,
        passPercentage
      }
    });

  } catch (error) {
    console.error('Fetch Analytics Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
