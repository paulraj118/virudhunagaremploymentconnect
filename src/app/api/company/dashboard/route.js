import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import DriveApplication from '@/models/DriveApplication';
import { getCurrentUser } from '@/lib/auth';
// Import student to populate student details
import Student from '@/models/Student'; 
import User from '@/models/User'; 

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch drives assigned to this company
    const drives = await RecruitmentDrive.find({ companyId: decoded.id }).lean();
    const driveIds = drives.map(d => d._id);

    // Fetch verified applications (or past verified stages) for these drives
    const allowedStatuses = ['Admin Verified', 'Company Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected'];
    
    const applications = await DriveApplication.find({
      driveId: { $in: driveIds },
      status: { $in: allowedStatuses }
    }).populate({ path: 'studentId', select: 'userId degree department', populate: { path: 'userId', model: User, select: 'name email' } }).lean();

    // Fetch interviews to count them
    const interviewsCount = await dbConnect().then(() => {
      // dynamically import Interview model if needed or just use mongoose.models.Interview
      const mongoose = require('mongoose');
      const Interview = mongoose.models.Interview || mongoose.model('Interview', new mongoose.Schema({}, { strict: false }));
      return Interview.countDocuments({ companyId: decoded.id });
    });

    const activeJobsCount = drives.filter(d => d.status === 'Active' || d.status === 'Published').length;
    const hiredCount = applications.filter(app => app.status === 'Selected').length;

    // Map student details correctly
    const formattedApps = applications.map(app => {
      return {
        ...app,
        studentId: {
          name: app.studentId?.userId?.name || 'Unknown',
          email: app.studentId?.userId?.email || 'Unknown',
          degree: app.studentId?.degree,
          department: app.studentId?.department
        }
      }
    });

    const stats = {
      activeJobs: activeJobsCount,
      totalApplicants: formattedApps.length,
      interviews: interviewsCount,
      hired: hiredCount
    };

    return NextResponse.json({ success: true, drives, applications: formattedApps, stats });
  } catch (error) {
    console.error('Fetch Company Dashboard Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
