import mongoose from 'mongoose';
import Interview from '@/models/Interview';
import JobApplication from '@/models/JobApplication';
import Notification from '@/models/Notification';
import AuditTrail from '@/models/AuditTrail';

function generateInterviewId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'INT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Shared service for creating and tracking Interview documents.
 * Includes Active State Concurrency Checks, Job Application syncing,
 * and isolated Notification & Audit Trail side-effects.
 */
export async function createUnifiedInterview(data, company, decodedId, decodedRole) {
  const {
    candidateId,
    jobId,
    applicationId,
    assessmentResultId,
    technicalAttemptId,
    interviewType,
    interviewRound,
    interviewDate,
    interviewTime,
    duration,
    timezone,
    interviewMode,
    meetingLink,
    meetingPlatform,
    venue,
    venueAddress,
    interviewerName,
    interviewerEmail,
    interviewerDesignation,
    interviewInstructions,
    status, // Default 'Scheduled'
    attachments,
    emailStatus // Optional: 'Pending', 'Sent', 'Failed'
  } = data;

  // 1. ACTIVE STATE CONCURRENCY CHECK (Idempotency / Duplicate Prevention)
  const existingInterview = await Interview.findOne({
    candidateId,
    jobId,
    interviewRound,
    status: { $in: ['Scheduled', 'Rescheduled', 'In Progress'] }
  }).lean();

  if (existingInterview) {
    const error = new Error(`An active interview for ${interviewRound} already exists for this candidate.`);
    error.status = 409;
    throw error;
  }

  // 2. Validate Job Application Ownership
  const jobApp = await JobApplication.findOne({ _id: applicationId, companyId: company._id });
  if (!jobApp) {
    const error = new Error('Job Application not found or unauthorized.');
    error.status = 403;
    throw error;
  }

  const interviewId = generateInterviewId();
  const finalStatus = status || 'Scheduled';

  // 3. Create Interview Document (Primary Transaction)
  const interview = await Interview.create({
    interviewId,
    companyId: company._id,
    hrId: decodedId,
    candidateId,
    jobId,
    applicationId,
    assessmentResultId: assessmentResultId || undefined,
    technicalAttemptId: technicalAttemptId || undefined,
    interviewType,
    interviewRound,
    interviewDate: new Date(interviewDate),
    interviewTime,
    duration: Number(duration),
    timezone: timezone || 'UTC',
    interviewMode,
    meetingLink: interviewMode === 'Online' ? meetingLink : undefined,
    meetingPlatform: interviewMode === 'Online' ? meetingPlatform : undefined,
    venue: interviewMode === 'Offline' ? venue : undefined,
    venueAddress: interviewMode === 'Offline' ? venueAddress : undefined,
    interviewerName,
    interviewerEmail,
    interviewerDesignation,
    interviewInstructions,
    status: finalStatus,
    confirmationStatus: 'Pending',
    attachments: attachments || [],
    createdBy: decodedId,
    timeline: [
      {
        status: finalStatus,
        timestamp: new Date(),
        actorId: decodedId,
        actorRole: decodedRole,
        remarks: `Interview created as status: ${finalStatus}`
      }
    ],
    // Extension for robust email tracking:
    ...(emailStatus ? { meta: { emailStatus, resendCount: 0 } } : {})
  });

  // 4. Synchronize Job Application Stage
  if (finalStatus === 'Scheduled') {
    jobApp.stage = 'Interview Scheduled';
    jobApp.interviewDate = new Date(interviewDate);
    if (meetingLink) jobApp.meetingLink = meetingLink;
    await jobApp.save();

    // 5. Async Side-Effect: Notification (Isolated try/catch)
    try {
      await Notification.create({
        recipientId: candidateId,
        recipientRole: 'student',
        message: `An interview round (${interviewRound}) has been scheduled for ${company.companyName} on ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}.`,
        type: 'interview_scheduled',
        link: `/student/interviews`
      });
    } catch (notifErr) {
      console.error('[INTERVIEW-SERVICE] Failed to notify candidate:', notifErr.message);
    }
  }

  // 6. Async Side-Effect: Audit Trail (Isolated try/catch)
  try {
    await AuditTrail.create({
      applicationId,
      actorId: decodedId,
      actorRole: decodedRole,
      previousStatus: 'None',
      newStatus: finalStatus === 'Draft' ? 'Draft Created' : 'Schedule Interview',
      remarks: `Interview round ${interviewRound} ${finalStatus === 'Draft' ? 'saved as Draft' : 'scheduled'} for ${interviewDate}.`
    });
  } catch (auditErr) {
    console.error('[INTERVIEW-SERVICE] Failed to create audit trail:', auditErr.message);
  }

  return interview;
}

/**
 * Helper to update email status post-transmission
 */
export async function updateInterviewEmailStatus(interviewDocumentId, newEmailStatus, errorMsg = null) {
  const updatePayload = {
    'meta.emailStatus': newEmailStatus,
    'meta.lastEmailSentAt': newEmailStatus === 'Sent' ? new Date() : undefined
  };

  if (errorMsg) {
    updatePayload['meta.lastEmailError'] = errorMsg;
  }

  await Interview.findByIdAndUpdate(interviewDocumentId, { $set: updatePayload }, { new: true });
}

/**
 * Handle Manual Resend Logic ensuring idempotency
 */
export async function resendInterviewEmailRecord(interviewDocumentId, decodedId, decodedRole) {
  const interview = await Interview.findById(interviewDocumentId);
  if (!interview) {
    const error = new Error('Interview not found.');
    error.status = 404;
    throw error;
  }

  // Atomically increment resend count
  await Interview.findByIdAndUpdate(interviewDocumentId, {
    $inc: { 'meta.resendCount': 1 },
    $set: { 'meta.emailStatus': 'Sent', 'meta.lastEmailSentAt': new Date() }
  });

  // Isolated Audit Trail
  try {
    await AuditTrail.create({
      applicationId: interview.applicationId,
      actorId: decodedId,
      actorRole: decodedRole,
      previousStatus: interview.status,
      newStatus: interview.status,
      remarks: `Interview invitation email manually resent.`
    });
  } catch (auditErr) {
    console.error('[INTERVIEW-SERVICE] Failed to log resend audit:', auditErr.message);
  }

  return interview;
}
