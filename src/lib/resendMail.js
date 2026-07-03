import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(toEmail, otp) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Employment Connect" <tnemploymentconnect@gmail.com>',
      to: toEmail,
      subject: 'Employment Connect Login Verification',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">EC</span>
            </div>
            <h2 style="color: #1e293b; margin: 0; font-size: 22px; font-weight: 700;">Login Verification</h2>
          </div>
          
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">Hello,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Your One-Time Password (OTP) is:</p>
          
          <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 600;">⏱ This OTP is valid for 5 minutes.</p>
          </div>
          
          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 6px;">Please do not share this OTP with anyone.</p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 32px;">If you did not request this login, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Regards,<br /><strong style="color: #64748b;">Employment Connect Team</strong>
          </p>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Nodemailer Send OTP Email Error:', error);
    return { success: false, error: error.message };
  }
}
