import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import Company from '@/models/Company';
import AssessmentResult from '@/models/AssessmentResult';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = params;

    await dbConnect();

    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
    }

    // Fetch all applications for this specific job belonging to this company
    const applications = await JobApplication.find({ jobId, companyId: company._id })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email mobile'
        }
      })
      .populate('jobId', 'title department location')
      .sort({ createdAt: -1 });

    // Fetch assessment results for all applicant students
    const studentIds = applications.map(app => app.studentId?._id).filter(Boolean);
    const assessmentResults = await AssessmentResult.find({ studentId: { $in: studentIds } })
      .sort({ createdAt: -1 });

    // Enrich applications with assessment data
    const enrichedApplications = applications.map(app => {
      const appObj = app.toObject();
      const result = assessmentResults.find(
        r => r.studentId.toString() === appObj.studentId?._id?.toString()
      );
      appObj.assessmentResult = result || null;
      return appObj;
    });

    // Ranking: Assessment % (desc) → AI Match Score (desc) → Application Date (latest first)
    const rankedApplicants = enrichedApplications.sort((a, b) => {
      const aScore = a.assessmentResult?.percentage || 0;
      const bScore = b.assessmentResult?.percentage || 0;
      if (bScore !== aScore) return bScore - aScore;

      const aAI = a.aiResumeScore || 0;
      const bAI = b.aiResumeScore || 0;
      if (bAI !== aAI) return bAI - aAI;

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Add rank numbers
    const withRanks = rankedApplicants.map((app, index) => ({
      ...app,
      rank: index + 1
    }));

    return NextResponse.json({
      success: true,
      applicants: withRanks,
      totalCount: withRanks.length
    });

  } catch (error) {
    console.error('Fetch Job Applicants Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
