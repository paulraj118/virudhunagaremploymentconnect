import { NextResponse } from 'next/server';
import { validateHRInterviewAccess } from '@/lib/interviewAuth';
import { calculateAndSyncOverallScore } from '@/lib/scoreRanking';
import JobApplication from '@/models/JobApplication';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import Student from '@/models/Student';

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const authResult = await validateHRInterviewAccess(id);
    if (!authResult.success) {
      return NextResponse.json(authResult.payload, { status: authResult.status });
    }

    const { interview, decoded, company } = authResult;
    const body = await request.json();
    const {
      communication,
      technicalKnowledge,
      problemSolving,
      confidence,
      professionalism,
      strengths,
      weaknesses,
      hrRemarks,
      remarks,
      status // defaults to Completed
    } = body;

    // Validate evaluation ratings (each 0 - 10)
    const comm = Math.min(10, Math.max(0, Number(communication || 0)));
    const tech = Math.min(10, Math.max(0, Number(technicalKnowledge || 0)));
    const prob = Math.min(10, Math.max(0, Number(problemSolving || 0)));
    const conf = Math.min(10, Math.max(0, Number(confidence || 0)));
    const prof = Math.min(10, Math.max(0, Number(professionalism || 0)));

    const totalInterviewScore = comm + tech + prob + conf + prof;
    const finalStatus = status || 'Completed';

    const previousStatus = interview.status;

    // Save Feedback
    interview.status = finalStatus;
    interview.feedback = {
      communication: comm,
      technicalKnowledge: tech,
      problemSolving: prob,
      confidence: conf,
      professionalism: prof,
      totalScore: totalInterviewScore,
      strengths: strengths || '',
      weaknesses: weaknesses || '',
      hrRemarks: hrRemarks || '',
      remarks: remarks || ''
    };

    // Timeline Log
    interview.timeline.push({
      status: finalStatus,
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || `Feedback submitted. Score: ${totalInterviewScore}/50`
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Update parent JobApplication interviewScore and final states
    const jobApp = await JobApplication.findById(interview.applicationId);
    let scoreResult = null;
    if (jobApp) {
      jobApp.interviewScore = totalInterviewScore;
      
      // Map final states if passed as feedback status
      if (finalStatus === 'Selected') {
        jobApp.stage = 'Interview Cleared';
        jobApp.finalDecision = 'Selected';
      } else if (finalStatus === 'Rejected') {
        jobApp.stage = 'Rejected';
        jobApp.finalDecision = 'Rejected';
      } else if (finalStatus === 'Hold') {
        jobApp.finalDecision = 'Hold';
      }
      await jobApp.save();

      // Recalculate overall scores, percentage, and ranks
      scoreResult = await calculateAndSyncOverallScore(interview.applicationId);
    }

    // Record Audit Trail
    await AuditTrail.create({
      applicationId: interview.applicationId,
      actorId: decoded.id,
      actorRole: decoded.role,
      previousStatus,
      newStatus: 'Submit Feedback',
      remarks: remarks || `Feedback submitted with score ${totalInterviewScore}/50. Status: ${finalStatus}.`
    });

    // Notify Candidate of completion
    const student = await Student.findOne({ userId: interview.candidateId });
    const companyName = company?.companyName || 'Company';

    try {
      let notifMsg = `Interview evaluation completed for ${companyName}. Score: ${totalInterviewScore}/50.`;
      if (finalStatus === 'Selected') {
        notifMsg = `Congratulations! You have been selected in the interview round (${interview.interviewRound}) for ${companyName}.`;
      } else if (finalStatus === 'Rejected') {
        notifMsg = `Interview evaluation completed. We regret to inform you that you have not been selected for the next rounds at ${companyName}.`;
      }

      await Notification.create({
        recipientId: interview.candidateId.toString(),
        recipientRole: 'student',
        message: notifMsg,
        type: 'interview_completed',
        link: '/student/interviews'
      });
    } catch (notifErr) {
      console.error('[FEEDBACK_API] Candidate notification failed:', notifErr.message);
    }

    // Notify HR / Company of feedback submission
    try {
      await Notification.create({
        recipientId: decoded.id,
        recipientRole: 'company',
        message: `Interview feedback submitted for candidate ${student?.name || 'Unknown'}. Score: ${totalInterviewScore}/50. Status: ${finalStatus}.`,
        type: 'interview_feedback_submitted',
        link: `/company/interviews`
      });
    } catch (hrNotifErr) {
      console.error('[FEEDBACK_API] HR notification failed:', hrNotifErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        interviewScore: totalInterviewScore,
        assessmentScore: scoreResult?.assessmentScore || 0,
        technicalScore: scoreResult?.technicalScore || 0,
        overallRecruitmentScore: scoreResult?.overallRecruitmentScore || 0,
        percentage: scoreResult?.percentage || 0,
        finalRank: scoreResult?.finalRank || 0,
        status: finalStatus
      }
    });

  } catch (error) {
    console.error('[INTERVIEW_FEEDBACK] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
