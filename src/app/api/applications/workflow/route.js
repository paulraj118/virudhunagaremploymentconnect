import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DriveApplication from '@/models/DriveApplication';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

const STAGES = [
  'Applied',
  'College Recommended',
  'Admin Verified',
  'Company Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Rejected'
];

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { applicationId, newStatus, remarks, interviewDate, interviewLocation } = await request.json();

    if (!STAGES.includes(newStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid stage transition' }, { status: 400 });
    }

    await dbConnect();
    const application = await DriveApplication.findById(applicationId);
    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    const previousStatus = application.status;

    // Role-based Transition Enforcement
    if (decoded.role === 'college') {
      if (newStatus !== 'College Recommended') {
        return NextResponse.json({ success: false, message: 'Colleges can only recommend students.' }, { status: 403 });
      }
    } else if (decoded.role === 'company') {
      // Company shouldn't revert back to admin verified or college recommended
      const allowedCompanyStages = ['Company Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected'];
      if (!allowedCompanyStages.includes(newStatus)) {
        return NextResponse.json({ success: false, message: 'Invalid transition for Company role.' }, { status: 403 });
      }
      // Ensure the company owns this application's drive
      if (application.companyId && application.companyId.toString() !== decoded.id) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role !== 'super_admin' && decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized role.' }, { status: 403 });
    }

    // Update Application
    const updatePayload = { status: newStatus };
    if (remarks) updatePayload.remarks = remarks;
    if (interviewDate) updatePayload.interviewDate = interviewDate;
    if (interviewLocation) updatePayload.interviewLocation = interviewLocation;

    await DriveApplication.findByIdAndUpdate(applicationId, updatePayload);

    // Record Audit Trail
    await AuditTrail.create({
      applicationId,
      actorId: decoded.id,
      actorRole: decoded.role,
      previousStatus,
      newStatus,
      remarks,
    });

    // Generate Notification for Student
    await Notification.create({
      recipientId: application.studentId.toString(),
      recipientRole: 'student',
      message: `Your application status has been updated to: ${newStatus}`,
      type: 'workflow_update',
      link: '/student/journey'
    });

    return NextResponse.json({ success: true, message: 'Workflow updated successfully' });
  } catch (error) {
    console.error('Workflow API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
