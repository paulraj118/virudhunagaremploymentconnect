import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import Student from '@/models/Student';
import User from '@/models/User';
import Job from '@/models/Job';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await dbConnect();

    const application = await JobApplication.findById(id)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('jobId')
      .populate('companyId');

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    // Auto Pick Details
    const candidateName = application.studentId?.userId?.name || 'Candidate';
    const candidateEmail = application.studentId?.userId?.email;
    const jobRole = application.jobId?.title || 'the position';
    const companyName = application.companyId?.companyName || 'Our Company';
    const hrName = application.companyId?.hrName || 'HR Team';
    const companyEmail = application.companyId?.supportEmail || decoded.email || 'hr@company.com';
    const companyPhone = application.companyId?.supportPhone || '';

    if (!candidateEmail) {
      return NextResponse.json({ success: false, message: 'Unable to send email. Candidate email not found.' }, { status: 400 });
    }

    // Create Email Body
    const emailSubject = 'Congratulations! You Have Been Shortlisted';
    const emailBody = `Dear ${candidateName},

Greetings from ${companyName}.

We are pleased to inform you that, based on your profile, resume, and assessment performance, you have been shortlisted for the next stage of our recruitment process.

Position: ${jobRole}

Your qualifications and skills closely match our requirements, and we would like to proceed with the interview process.

Please confirm your availability by replying to this email.

If you have any questions, feel free to contact us.

We look forward to meeting you.

Best Regards,

${hrName}
${companyName}
${companyEmail}
${companyPhone}`;

    // Send Email via Nodemailer
    try {
      // 1. Handle missing environment variables properly
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('Email configuration missing: SMTP_HOST, SMTP_USER, or SMTP_PASS is not set in environment variables.');
        return NextResponse.json({ success: false, message: 'Email service is not configured on the server. Please contact administrator.' }, { status: 500 });
      }

      // 2. Validate recipient email format before sending
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(candidateEmail)) {
        console.error(`Invalid email format: ${candidateEmail}`);
        return NextResponse.json({ success: false, message: 'Invalid candidate email address format.' }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // 3. Verify SMTP connection before attempting to send (catches auth/network errors)
      await transporter.verify();

      // 4. Actually send the email (prevent false success)
      const info = await transporter.sendMail({
        from: `"${companyName}" <${process.env.SMTP_USER}>`, // using authenticated user to prevent rejection
        replyTo: companyEmail,
        to: candidateEmail,
        subject: emailSubject,
        text: emailBody,
      });

      console.log(`Email successfully sent to ${candidateEmail}. Message ID: ${info.messageId}`);
      
    } catch (emailError) {
      // 5. Log detailed errors in the backend
      console.error('Email delivery failed:', emailError.message || emailError);
      return NextResponse.json({ success: false, message: `Email delivery failed: ${emailError.message || 'Unknown SMTP error'}` }, { status: 500 });
    }

    // Only update status to Shortlisted IF email is sent successfully
    application.stage = 'Shortlisted';
    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully.',
      application
    });

  } catch (error) {
    console.error('Send Email Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
