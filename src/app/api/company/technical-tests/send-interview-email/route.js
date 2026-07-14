import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/resendMail';
import { buildInterviewEmailTemplate } from '@/lib/emailTemplates';

export async function POST(request) {
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

    const body = await request.json();
    const {
      candidateId,
      jobId,
      applicationId,
      interviewRound,
      candidateName,
      candidateEmail,
      jobTitle,
      interviewType,
      interviewMode,
      interviewDate,
      interviewTime,
      duration,
      meetingLink,
      venue,
      interviewerName,
      interviewerEmail,
      contactNumber,
      responseDeadline,
      emailSubject,
      emailContent,
      sendCopyToHR,
      highPriority,
      attachment // { filename, data (base64), contentType }
    } = body;

    // --- Validation ---
    const errors = [];
    if (!candidateId || !jobId || !applicationId || !interviewRound) {
      errors.push('Database mapping details (Candidate ID, Job ID, Application ID, Round) are required');
    }
    if (!candidateEmail) errors.push('Candidate email is required');
    if (!interviewType) errors.push('Interview type is required');
    if (!interviewMode) errors.push('Interview mode is required');
    if (!interviewDate) errors.push('Interview date is required');
    if (!interviewTime) errors.push('Interview time is required');
    if (!emailSubject) errors.push('Email subject is required');
    if (!emailContent) errors.push('Email content is required');
    if (!interviewerName) errors.push('Interviewer name is required');

    // Conditional validations
    if (interviewMode === 'Online' && !meetingLink) {
      errors.push('Meeting link is required for Online interviews');
    }
    if (interviewMode === 'Offline' && !venue) {
      errors.push('Venue is required for Offline interviews');
    }

    // Past date check
    const interviewDateObj = new Date(interviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (interviewDateObj < today) {
      errors.push('Interview date cannot be in the past');
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (candidateEmail && !emailRegex.test(candidateEmail)) {
      errors.push('Invalid candidate email format');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: errors.join('. '), errors }, { status: 400 });
    }

    // --- Build Professional HTML Email ---
    const companyName = company.companyName || 'Our Company';
    const hrName = company.hrName || 'HR Team';
    const companyEmail = company.supportEmail || company.hrEmail || '';
    const companyPhone = company.supportPhone || contactNumber || '';

    const htmlEmail = buildInterviewEmailTemplate({
      companyName,
      hrName,
      companyEmail,
      companyPhone,
      candidateName: candidateName || 'Candidate',
      emailContent,
      jobTitle: jobTitle || 'N/A',
      interviewType,
      interviewDate,
      interviewTime,
      duration: duration || 'N/A',
      interviewMode,
      meetingLink,
      venue,
      interviewerName: interviewerName || 'N/A',
      interviewerEmail,
      contactNumber,
      responseDeadline
    });

    // --- 1. Database Transaction (Multi-stage commit) ---
    const { createUnifiedInterview, updateInterviewEmailStatus } = await import('@/lib/interviewService');
    let interviewDocument;

    try {
      interviewDocument = await createUnifiedInterview({
        candidateId,
        jobId,
        applicationId,
        interviewType,
        interviewRound,
        interviewDate,
        interviewTime,
        duration: parseInt(duration) || 30,
        interviewMode,
        meetingLink,
        meetingPlatform: 'Other',
        venue,
        venueAddress: venue,
        interviewerName,
        interviewerEmail,
        interviewerDesignation: 'Interviewer',
        interviewInstructions: emailContent,
        status: 'Scheduled',
        emailStatus: 'Pending', // Track that we started the email attempt
      }, company, decoded.id, decoded.role);
    } catch (dbError) {
      return NextResponse.json({ success: false, message: dbError.message }, { status: dbError.status || 500 });
    }

    // --- Prepare Email Options ---
    const emailOptions = {
      to: candidateEmail,
      subject: emailSubject,
      html: htmlEmail,
      replyTo: companyEmail || interviewerEmail || undefined,
    };

    if (sendCopyToHR && companyEmail) emailOptions.cc = companyEmail;
    if (highPriority) emailOptions.priority = 'high';
    if (attachment && attachment.data && attachment.filename) {
      emailOptions.attachments = [{
        filename: attachment.filename,
        content: Buffer.from(attachment.data, 'base64'),
        contentType: attachment.contentType || 'application/pdf'
      }];
    }

    // --- 2. External Side-Effect (Send Email) ---
    const result = await sendEmail(emailOptions);

    if (!result.success) {
      console.error(`[INTERVIEW-EMAIL] Failed to send to ${candidateEmail}:`, result.error);
      
      // 3a. Update DB on Failure
      await updateInterviewEmailStatus(interviewDocument._id, 'Failed', result.error);
      
      return NextResponse.json({
        success: false,
        message: `Interview scheduled internally, but email delivery failed: ${result.error || 'Unknown SMTP error'}`
      }, { status: 500 });
    }

    console.log(`[INTERVIEW-EMAIL] HR ${decoded.id} sent interview invitation to ${candidateEmail} for job "${jobTitle}". MessageId: ${result.messageId}`);

    // 3b. Update DB on Success
    await updateInterviewEmailStatus(interviewDocument._id, 'Sent');

    return NextResponse.json({
      success: true,
      message: 'Interview invitation sent and scheduled successfully.',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('[INTERVIEW-EMAIL] Server Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
