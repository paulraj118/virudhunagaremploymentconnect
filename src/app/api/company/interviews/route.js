import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import DriveApplication from '@/models/DriveApplication';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';
import Student from '@/models/Student';
import User from '@/models/User';
import Company from '@/models/Company';
import JobApplication from '@/models/JobApplication';
import Job from '@/models/Job';

// Note: generateInterviewId moved to src/lib/interviewService.js
// GET - HR Interview List
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Access denied.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    await dbConnect();

    // Legacy College Placement Drive Company Flow
    if (decoded.role === 'company') {
      const interviews = await Interview.find({ companyId: decoded.id })
        .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', model: User, select: 'name email' } })
        .populate('driveId', 'jobRole')
        .sort({ date: 1 })
        .lean();
      return NextResponse.json({ success: true, message: 'Legacy interviews retrieved', data: interviews });
    }

    // Unified Job Portal HR Flow
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company profile not found', errors: ['Linked company not found'] },
          { status: 404 }
        );
      }

      const { searchParams } = new URL(request.url);
      const statusFilter = searchParams.get('status');

      const filter = { companyId: company._id };
      if (statusFilter) {
        filter.status = statusFilter;
      }

      const interviews = await Interview.find(filter)
        .populate('candidateId', 'name email gender')
        .populate({
          path: 'applicationId',
          select: 'studentId',
          populate: { path: 'studentId', select: 'collegeName' }
        })
        .populate('jobId', 'title role')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        message: 'Interviews retrieved successfully',
        data: interviews
      });
    }

    return NextResponse.json(
      { success: false, message: 'Forbidden: Invalid role', errors: ['Insufficient permissions'] },
      { status: 403 }
    );
  } catch (error) {
    console.error('[INTERVIEWS] Fetch Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}

// POST - Schedule Interview / Save Draft
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Access denied.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    const data = await request.json();
    await dbConnect();

    // Legacy College Placement Drive Company Flow
    if (decoded.role === 'company') {
      const app = await DriveApplication.findById(data.applicationId);
      if (!app || app.companyId.toString() !== decoded.id) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Access denied.', errors: ['Application ownership validation failed'] },
          { status: 403 }
        );
      }

      const interview = await Interview.create({
        ...data,
        companyId: decoded.id,
        driveId: app.driveId,
        studentId: app.studentId,
        status: 'Scheduled',
        createdBy: decoded.id
      });

      if (app.status === 'Company Shortlisted') {
        app.status = 'Interview Scheduled';
        app.interviewDate = new Date(`${data.date}T${data.startTime}`);
        app.interviewLocation = data.mode === 'Online' ? data.meetingLink : data.venue;
        await app.save();
      }

      await AuditTrail.create({
        applicationId: app._id,
        actorId: decoded.id,
        actorRole: 'company',
        previousStatus: app.status,
        newStatus: 'Interview Scheduled',
        remarks: `Interview Type: ${data.type} scheduled for ${data.date}.`
      });

      await Notification.create({
        recipientId: app.studentId.toString(),
        recipientRole: 'student',
        message: `An interview (${data.type}) has been scheduled by the company.`,
        type: 'interview_update',
        link: '/student/interviews'
      });

      return NextResponse.json({
        success: true,
        message: 'Legacy interview scheduled successfully',
        data: interview
      });
    }

    // Unified Job Portal HR Flow
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company profile not found', errors: ['Linked company not found'] },
          { status: 404 }
        );
      }

      // Delegate to the shared service for Database writes & idempotency checks
      try {
        const { createUnifiedInterview } = await import('@/lib/interviewService');
        const interview = await createUnifiedInterview(data, company, decoded.id, decoded.role);
        
        return NextResponse.json({
          success: true,
          message: data.status === 'Draft' ? 'Interview saved as draft successfully' : 'Interview scheduled successfully',
          data: interview
        });
      } catch (svcError) {
        return NextResponse.json(
          { success: false, message: svcError.message },
          { status: svcError.status || 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Forbidden: Invalid role', errors: ['Insufficient permissions'] },
      { status: 403 }
    );
  } catch (error) {
    console.error('[INTERVIEWS] Creation Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message, errors: [error.message] },
      { status: 500 }
    );
  }
}
