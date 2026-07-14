import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/resendMail';
import { resendInterviewEmailRecord, updateInterviewEmailStatus } from '@/lib/interviewService';
import { buildInterviewEmailTemplate } from '@/lib/emailTemplates';

export async function POST(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: interviewDocumentId } = resolvedParams;

    await dbConnect();

    // Verify ownership
    const interview = await Interview.findById(interviewDocumentId).populate('candidateId', 'name email');
    if (!interview) {
      return NextResponse.json({ success: false, message: 'Interview not found' }, { status: 404 });
    }

    // Only unified portal uses hr_company. Company check.
    let company;
    if (decoded.role === 'hr_company') {
      company = await Company.findOne({ userId: decoded.id });
      if (!company || interview.companyId.toString() !== company._id.toString()) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    } else if (interview.companyId.toString() !== decoded.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      emailSubject, 
      htmlEmail, // Support legacy raw html payload
      emailContent, // Text content for template
      sendCopyToHR, 
      highPriority,
      // Extracted for template
      candidateName,
      jobTitle,
      interviewType,
      interviewDate,
      interviewTime,
      duration,
      interviewMode,
      meetingLink,
      venue,
      interviewerName,
      interviewerEmail,
      contactNumber,
      responseDeadline
    } = body;

    if (!emailSubject) {
      return NextResponse.json({ success: false, message: 'Email subject is required' }, { status: 400 });
    }

    if (!htmlEmail && !emailContent) {
      return NextResponse.json({ success: false, message: 'Either htmlEmail or emailContent is required' }, { status: 400 });
    }

    const candidateEmail = interview.candidateId?.email || body.candidateEmail;
    if (!candidateEmail) {
       return NextResponse.json({ success: false, message: 'Candidate email not found' }, { status: 400 });
    }

    // Build the template if emailContent is passed, otherwise use raw htmlEmail
    let finalHtml = htmlEmail;
    if (!finalHtml && emailContent) {
      // If we didn't fetch company for hr_company, we might need it for details
      if (!company && decoded.role !== 'hr_company') {
        company = await Company.findById(decoded.id);
      }
      
      finalHtml = buildInterviewEmailTemplate({
        companyName: company?.companyName || 'Our Company',
        hrName: company?.hrName || 'HR Team',
        companyEmail: company?.supportEmail || company?.hrEmail || '',
        companyPhone: company?.supportPhone || contactNumber || '',
        candidateName: candidateName || interview.candidateId?.name || 'Candidate',
        emailContent,
        jobTitle: jobTitle || 'N/A',
        interviewType: interviewType || interview.interviewType,
        interviewDate: interviewDate || interview.interviewDate,
        interviewTime: interviewTime || interview.interviewTime,
        duration: duration || interview.duration || 'N/A',
        interviewMode: interviewMode || interview.interviewMode,
        meetingLink: meetingLink || interview.meetingLink,
        venue: venue || interview.venueAddress,
        interviewerName: interviewerName || interview.interviewerName || 'N/A',
        interviewerEmail: interviewerEmail || interview.interviewerEmail || '',
        contactNumber: contactNumber || '',
        responseDeadline: responseDeadline || ''
      });
    }

    const emailOptions = {
      to: candidateEmail,
      subject: emailSubject,
      html: finalHtml,
    };

    if (sendCopyToHR && decoded.email) emailOptions.cc = decoded.email;
    if (highPriority) emailOptions.priority = 'high';

    // Send email
    const result = await sendEmail(emailOptions);

    if (!result.success) {
      await updateInterviewEmailStatus(interview._id, 'Failed', result.error);
      return NextResponse.json({ success: false, message: 'Failed to resend email: ' + result.error }, { status: 500 });
    }

    // Update resend tracking fields securely
    await resendInterviewEmailRecord(interview._id, decoded.id, decoded.role);

    return NextResponse.json({
      success: true,
      message: 'Email resent successfully.',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('[INTERVIEW-RESEND]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
