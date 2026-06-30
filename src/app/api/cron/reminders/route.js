import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import Notification from '@/models/Notification';
import Company from '@/models/Company';

export async function GET(request) {
  try {
    await dbConnect();
    const now = new Date();

    // 1. Calculate boundaries for 24-hour reminder
    const min24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const max24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 2. Calculate boundaries for 1-hour reminder
    const min1h = new Date(now.getTime() + 30 * 60 * 1000);
    const max1h = new Date(now.getTime() + 90 * 60 * 1000);

    const reports = {
      remindersSent24h: [],
      remindersSent1h: []
    };

    // --- 24-Hour Reminders ---
    const upcoming24h = await Interview.find({
      status: { $in: ['Scheduled', 'Rescheduled'] },
      interviewDate: { $gte: min24h, $lte: max24h },
      reminder24hSent: { $ne: true }
    });

    for (const interview of upcoming24h) {
      const company = await Company.findById(interview.companyId);
      const companyName = company?.companyName || 'Company';

      // Send Notification
      await Notification.create({
        recipientId: interview.candidateId.toString(),
        recipientRole: 'student',
        message: `Reminder: You have an interview with ${companyName} scheduled for tomorrow at ${interview.interviewTime}.`,
        type: 'interview_reminder_24h',
        link: '/student/interviews'
      });

      // Update flag & timeline
      interview.reminder24hSent = true;
      interview.timeline.push({
        status: 'Reminder Sent',
        timestamp: new Date(),
        actorId: 'system',
        actorRole: 'system',
        remarks: '24-hour pre-interview reminder sent to candidate'
      });
      await interview.save();

      reports.remindersSent24h.push(interview.interviewId);
    }

    // --- 1-Hour Reminders ---
    const upcoming1h = await Interview.find({
      status: { $in: ['Scheduled', 'Rescheduled'] },
      interviewDate: { $gte: min1h, $lte: max1h },
      reminder1hSent: { $ne: true }
    });

    for (const interview of upcoming1h) {
      const company = await Company.findById(interview.companyId);
      const companyName = company?.companyName || 'Company';

      // Send Notification
      await Notification.create({
        recipientId: interview.candidateId.toString(),
        recipientRole: 'student',
        message: `Reminder: Your interview with ${companyName} starts in 1 hour at ${interview.interviewTime}.`,
        type: 'interview_reminder_1h',
        link: '/student/interviews'
      });

      // Update flag & timeline
      interview.reminder1hSent = true;
      interview.timeline.push({
        status: 'Reminder Sent',
        timestamp: new Date(),
        actorId: 'system',
        actorRole: 'system',
        remarks: '1-hour pre-interview reminder sent to candidate'
      });
      await interview.save();

      reports.remindersSent1h.push(interview.interviewId);
    }

    return NextResponse.json({
      success: true,
      message: `Cron reminders executed. Sent ${reports.remindersSent24h.length} 24h reminders and ${reports.remindersSent1h.length} 1h reminders.`,
      data: reports
    });

  } catch (error) {
    console.error('[CRON_REMINDERS] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
