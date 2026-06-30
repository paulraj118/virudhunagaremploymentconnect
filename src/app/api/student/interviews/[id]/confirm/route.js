import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import Interview from '@/models/Interview';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Student role required.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const interview = await Interview.findById(id);
    if (!interview) {
      return NextResponse.json(
        { success: false, message: 'Interview not found', errors: [`No interview with ID ${id}`] },
        { status: 404 }
      );
    }

    // Candidate Ownership check
    const candidateIdStr = interview.candidateId.toString();
    if (decoded.id !== candidateIdStr) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You do not own this interview.', errors: ['Access denied'] },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { confirmationStatus, declineReason, rescheduleNotes, remarks } = body;

    const validStatuses = ['Accepted', 'Declined', 'Reschedule Requested'];
    if (!confirmationStatus || !validStatuses.includes(confirmationStatus)) {
      return NextResponse.json(
        { success: false, message: 'Invalid confirmation status. Must be one of: Accepted, Declined, Reschedule Requested.' },
        { status: 400 }
      );
    }

    // Duplicate Confirmation Guard
    if (interview.confirmationStatus === confirmationStatus) {
      return NextResponse.json(
        { success: false, message: `Interview confirmation is already set to ${confirmationStatus.toLowerCase()}`, errors: ['Duplicate confirmation status'] },
        { status: 400 }
      );
    }

    // Apply updates
    interview.confirmationStatus = confirmationStatus;
    if (confirmationStatus === 'Declined') {
      interview.candidateDeclineReason = declineReason || 'No reason provided';
      interview.status = 'Cancelled'; // Auto cancel if declined? Or keep status. Let's keep status and just set confirmation status, or let HR cancel. Actually, setting confirmationStatus is enough, but setting status = 'Cancelled' if declined is optional. Let's keep status as is and let HR see candidate declined.
    } else if (confirmationStatus === 'Reschedule Requested') {
      interview.candidateRescheduleNotes = rescheduleNotes || 'No notes provided';
    }

    // Add Timeline log
    interview.timeline.push({
      status: `Candidate ${confirmationStatus}`,
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || `Candidate updated confirmation status to ${confirmationStatus}`
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Notify HR / Company
    // Get candidate name
    const studentUser = await User.findById(decoded.id);
    const candidateName = studentUser?.name || 'Candidate';

    let notifMsg = `Candidate ${candidateName} has ${confirmationStatus.toLowerCase()} the interview (Round: ${interview.interviewRound}).`;
    if (confirmationStatus === 'Reschedule Requested') {
      notifMsg = `Candidate ${candidateName} has requested a reschedule for their interview. Notes: ${rescheduleNotes || 'None'}`;
    } else if (confirmationStatus === 'Declined') {
      notifMsg = `Candidate ${candidateName} has declined the interview. Reason: ${declineReason || 'None'}`;
    }

    await Notification.create({
      recipientId: interview.hrId.toString(),
      recipientRole: 'company',
      message: notifMsg,
      type: 'interview_confirmation_update',
      link: `/company/interviews`
    });

    return NextResponse.json({
      success: true,
      message: `Interview confirmation status updated to ${confirmationStatus} successfully`,
      data: interview
    });

  } catch (error) {
    console.error('[CANDIDATE_CONFIRM] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
