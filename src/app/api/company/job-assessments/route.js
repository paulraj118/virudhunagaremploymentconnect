import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import Company from '@/models/Company';
import Student from '@/models/Student';
import User from '@/models/User';
import Job from '@/models/Job';
import AssessmentResult from '@/models/AssessmentResult';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let company;
    if (decoded.role === 'hr_company') {
      company = await Company.findOne({ userId: decoded.id });
    } else {
      company = await Company.findById(decoded.id);
    }
    
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
    }

    // Get all jobs for this company
    const companyJobs = await Job.find({ companyId: company._id }).select('title').lean();

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const search = searchParams.get('search') || '';
    const collegeName = searchParams.get('collegeName') || '';
    const status = searchParams.get('status') || ''; // 'Pass', 'Fail', 'Not Taken'
    const scoreRange = searchParams.get('scoreRange') || ''; // e.g. "70-100", "50-70", "0-50"
    const date = searchParams.get('date') || ''; // YYYY-MM-DD
    const sortBy = searchParams.get('sortBy') || 'latest'; // 'latest', 'highest', 'lowest'

    let appQuery = { companyId: company._id };
    if (jobId && jobId !== 'All' && jobId !== 'null') {
      appQuery.jobId = jobId;
    } else {
      // Fetch across all company jobs
      appQuery.jobId = { $in: companyJobs.map(j => j._id) };
    }

    // Find all applications
    const applications = await JobApplication.find(appQuery)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('jobId', 'title')
      .lean();

    // Fetch corresponding assessment results
    const studentIds = applications.map(app => app.studentId?._id).filter(Boolean);
    const jobIds = applications.map(app => app.jobId?._id).filter(Boolean);

    const assessmentResults = await AssessmentResult.find({
      studentId: { $in: studentIds },
      jobId: { $in: jobIds }
    }).lean();

    // Map assessments to applications
    let candidates = applications.map(app => {
      const result = assessmentResults.find(r => 
        r.studentId.toString() === app.studentId?._id?.toString() &&
        r.jobId?.toString() === app.jobId?._id?.toString()
      );

      return {
        applicationId: app._id,
        candidateName: app.studentId?.userId?.name || 'N/A',
        candidateEmail: app.studentId?.userId?.email || 'N/A',
        collegeName: app.studentId?.collegeName || 'N/A',
        preferredDomain: app.studentId?.preferredDomain || 'N/A',
        industryTrack: app.studentId?.industryTrack || 'N/A',
        assessmentStatus: result ? result.passFail : 'Not Taken',
        assessmentScore: result ? result.percentage : null,
        completionDate: result ? result.submissionTimestamp || result.createdAt : null,
        report: result || null
      };
    });

    // Apply Backend Search and Filters
    if (search) {
      const lowerSearch = search.toLowerCase();
      candidates = candidates.filter(c => 
        c.candidateName.toLowerCase().includes(lowerSearch) ||
        c.candidateEmail.toLowerCase().includes(lowerSearch)
      );
    }

    if (collegeName) {
      const lowerCol = collegeName.toLowerCase();
      candidates = candidates.filter(c => c.collegeName.toLowerCase().includes(lowerCol));
    }

    if (status && status !== 'All') {
      candidates = candidates.filter(c => c.assessmentStatus === status);
    }

    if (scoreRange) {
      const [min, max] = scoreRange.split('-').map(Number);
      candidates = candidates.filter(c => 
        c.assessmentScore !== null && 
        c.assessmentScore >= min && 
        c.assessmentScore <= max
      );
    }

    if (date) {
      candidates = candidates.filter(c => {
        if (!c.completionDate) return false;
        const compDate = new Date(c.completionDate).toISOString().split('T')[0];
        return compDate === date;
      });
    }

    // Apply Backend Sorting
    if (sortBy === 'highest') {
      candidates.sort((a, b) => (b.assessmentScore || 0) - (a.assessmentScore || 0));
    } else if (sortBy === 'lowest') {
      candidates.sort((a, b) => {
        if (a.assessmentScore === null) return 1;
        if (b.assessmentScore === null) return -1;
        return a.assessmentScore - b.assessmentScore;
      });
    } else {
      // Default: Latest Assessment
      candidates.sort((a, b) => {
        if (!a.completionDate) return 1;
        if (!b.completionDate) return -1;
        return new Date(b.completionDate) - new Date(a.completionDate);
      });
    }

    return NextResponse.json({
      success: true,
      jobs: companyJobs,
      candidates
    });

  } catch (error) {
    console.error('Company Job Assessments GET Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
