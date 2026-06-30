import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import Company from '@/models/Company';
import Student from '@/models/Student';
import User from '@/models/User';
import Job from '@/models/Job';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
    }

    // Populate student details, user details, and job details
    const applications = await JobApplication.find({ companyId: company._id })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email mobile'
        }
      })
      .populate('jobId', 'title department')
      .sort({ createdAt: -1 });

    const studentIds = applications.map(app => app.studentId?._id).filter(Boolean);
    const { default: AssessmentResult } = await import('@/models/AssessmentResult');
    const assessmentResults = await AssessmentResult.find({ studentId: { $in: studentIds } }).sort({ createdAt: -1 });

    let enrichedApplications = applications.map(app => {
      const appObj = app.toObject();
      const result = appObj.studentId && appObj.studentId._id
        ? assessmentResults.find(r => r.studentId && r.studentId.toString() === appObj.studentId._id.toString())
        : null;
      appObj.assessmentResult = result;
      return appObj;
    });

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    if (roleFilter && roleFilter !== 'All Jobs') {
      enrichedApplications = enrichedApplications.filter(app => app.jobId?.title === roleFilter);
    }

    // Rank applicants
    enrichedApplications.sort((a, b) => {
      const scoreA = a.assessmentResult?.percentage || 0;
      const scoreB = b.assessmentResult?.percentage || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      const aiMatchA = a.aiResumeScore || 0;
      const aiMatchB = b.aiResumeScore || 0;
      if (aiMatchA !== aiMatchB) return aiMatchB - aiMatchA;

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const rankedApplications = enrichedApplications.map((app, index) => {
      let medal = '';
      if (index === 0) medal = '🥇 ';
      else if (index === 1) medal = '🥈 ';
      else if (index === 2) medal = '🥉 ';
      
      app.rankString = `${medal}Rank #${index + 1}`;
      app.rankValue = index + 1;
      return app;
    });

    return NextResponse.json({
      success: true,
      applications: rankedApplications
    });

  } catch (error) {
    console.error('Fetch Applications Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
