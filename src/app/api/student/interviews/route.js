import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import Job from '@/models/Job';
import User from '@/models/User';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Student role required.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    await dbConnect();
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student profile not found.', errors: ['Candidate profile not configured'] },
        { status: 404 }
      );
    }

    // 1. Fetch legacy Placement Drive Interviews (if any exist)
    const dbLegacyInterviews = await Interview.find({ studentId: student._id })
      .populate('companyId', 'companyName companyLogo')
      .populate('driveId', 'jobRole')
      .sort({ date: 1 })
      .lean();

    // 2. Fetch unified Phase 6 Job Portal Interviews
    const dbPortalInterviews = await Interview.find({ candidateId: decoded.id })
      .populate('companyId', 'companyName companyLogo website')
      .populate('jobId', 'title role')
      .sort({ interviewDate: 1 })
      .lean();

    // Map portal interviews to standard output properties for display
    const mappedPortalInterviews = dbPortalInterviews.map(item => ({
      _id: item._id,
      interviewId: item.interviewId,
      companyId: {
        companyName: item.companyId?.companyName || 'Company',
        companyLogo: item.companyId?.companyLogo || ''
      },
      driveId: {
        jobRole: item.jobId?.title || 'Job Position'
      },
      type: item.interviewRound,
      date: item.interviewDate,
      startTime: item.interviewTime,
      endTime: 'N/A',
      mode: item.interviewMode,
      meetingLink: item.meetingLink,
      venue: item.venue,
      status: item.status,
      interviewerName: item.interviewerName,
      instructions: item.interviewInstructions || item.instructions,
      
      // Phase 6.1 extra fields
      interviewType: item.interviewType,
      timezone: item.timezone,
      meetingPlatform: item.meetingPlatform,
      venueAddress: item.venueAddress,
      interviewerEmail: item.interviewerEmail,
      interviewerDesignation: item.interviewerDesignation,
      interviewInstructions: item.interviewInstructions,
      confirmationStatus: item.confirmationStatus,
      candidateDeclineReason: item.candidateDeclineReason,
      candidateRescheduleNotes: item.candidateRescheduleNotes,
      timeline: item.timeline,
      attachments: item.attachments,
      actualStartTime: item.actualStartTime,
      actualEndTime: item.actualEndTime,
      completionPercentage: item.completionPercentage,
      attendanceStatus: item.attendanceStatus,
      feedback: item.feedback
    }));

    // Merge both
    const allInterviews = [...dbLegacyInterviews, ...mappedPortalInterviews].sort((a, b) => new Date(a.date || a.interviewDate) - new Date(b.date || b.interviewDate));

    return NextResponse.json({
      success: true,
      message: 'Interviews retrieved successfully',
      data: { interviews: allInterviews },
      interviews: allInterviews // Backwards compatibility for UI list pages
    });
  } catch (error) {
    console.error('Fetch Student Interviews Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
