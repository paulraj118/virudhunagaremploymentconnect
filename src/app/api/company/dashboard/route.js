import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Job from '@/models/Job';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';
import JobApplication from '@/models/JobApplication';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    const activeJobsCount = await Job.countDocuments({ companyId: company._id, isActive: true });
    
    // Total applicants for all jobs of this company
    const jobs = await Job.find({ companyId: company._id });
    const jobIds = jobs.map(job => job._id);
    
    const totalApplicantsCount = await JobApplication.countDocuments({ jobId: { $in: jobIds } });
    
    // For now, Interviews and Hired can be calculated based on application status if it exists, otherwise 0
    const interviewsCount = await JobApplication.countDocuments({ jobId: { $in: jobIds }, status: 'interview' });
    const hiredCount = await JobApplication.countDocuments({ jobId: { $in: jobIds }, status: 'hired' });

    return NextResponse.json({
      success: true,
      stats: {
        activeJobs: activeJobsCount,
        totalApplicants: totalApplicantsCount,
        interviews: interviewsCount,
        hired: hiredCount
      }
    });

  } catch (error) {
    console.error('Fetch Dashboard Stats Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
