export const buildInterviewEmailTemplate = ({
  companyName = 'Our Company',
  hrName = 'HR Team',
  companyEmail = '',
  companyPhone = '',
  candidateName = 'Candidate',
  emailContent = '',
  jobTitle = 'N/A',
  interviewType = 'Technical',
  interviewDate = '',
  interviewTime = '',
  duration = 'N/A',
  interviewMode = 'Online',
  meetingLink = '',
  venue = '',
  interviewerName = 'N/A',
  interviewerEmail = '',
  contactNumber = '',
  responseDeadline = ''
}) => {
  const formattedDate = new Date(interviewDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const locationInfo = interviewMode === 'Online'
    ? `<a href="${meetingLink}" style="color: #4f46e5; text-decoration: underline;">${meetingLink}</a>`
    : interviewMode === 'Offline'
      ? venue
      : `${meetingLink || ''} / ${venue || ''}`;

  const locationLabel = interviewMode === 'Online' ? 'Meeting Link' : interviewMode === 'Offline' ? 'Venue' : 'Location';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0B1E40, #1e3a5f); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="color: white; font-size: 22px; font-weight: bold;">EC</span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Interview Invitation</h1>
      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">${companyName}</p>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
      
      <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        Dear <strong>${candidateName}</strong>,
      </p>

      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0; white-space: pre-line;">
        ${emailContent}
      </p>

      <!-- Interview Details Table -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <div style="background: #0B1E40; padding: 12px 20px;">
          <h3 style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 700;">Interview Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600; width: 40%;">Company</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${companyName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Position</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${jobTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Interview Type</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${interviewType}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Date</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Time</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${interviewTime}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Duration</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${duration}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Mode</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${interviewMode}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">${locationLabel}</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${locationInfo}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; font-size: 13px; color: #64748b; font-weight: 600;">Interviewer</td>
            <td style="padding: 12px 20px; font-size: 13px; color: #1e293b; font-weight: 600;">${interviewerName}</td>
          </tr>
        </table>
      </div>

      <!-- Important Instructions -->
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 13px; font-weight: 700;">Important Instructions</h4>
        <ul style="color: #92400e; font-size: 12px; margin: 0; padding-left: 16px; line-height: 1.8;">
          <li>Please join the interview <strong>10 minutes</strong> before the scheduled time.</li>
          <li>Ensure a stable internet connection${interviewMode === 'Online' ? ' and a working camera/microphone.' : '.'}</li>
          <li>Carry a copy of your resume and relevant certificates.</li>
          ${responseDeadline ? `<li>Please confirm your availability by <strong>${new Date(responseDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.</li>` : ''}
        </ul>
      </div>

      <!-- Contact -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px 20px; margin-bottom: 8px;">
        <p style="color: #0369a1; font-size: 13px; margin: 0; font-weight: 600;">Contact Information</p>
        <p style="color: #0c4a6e; font-size: 12px; margin: 6px 0 0 0; line-height: 1.7;">
          ${interviewerName ? `Interviewer: ${interviewerName}` : ''}
          ${interviewerEmail ? ` | ${interviewerEmail}` : ''}
          ${contactNumber ? ` | ${contactNumber}` : ''}
        </p>
        <p style="color: #0c4a6e; font-size: 12px; margin: 4px 0 0 0; line-height: 1.7;">
          HR: ${hrName} ${companyEmail ? `| ${companyEmail}` : ''} ${companyPhone ? `| ${companyPhone}` : ''}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0B1E40; border-radius: 0 0 16px 16px; padding: 24px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px 0;">This is an automated email from Employment Connect.</p>
      <p style="color: #64748b; font-size: 11px; margin: 0;">${new Date().getFullYear()} Employment Connect | ${companyName}</p>
    </div>

  </div>
</body>
</html>`;
};
