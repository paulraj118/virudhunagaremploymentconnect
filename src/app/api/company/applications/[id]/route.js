import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import { getCurrentUser } from '@/lib/auth';

import Company from '@/models/Company';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { stage, interviewDate, meetingLink, feedback } = body;
    
    const mongoose = (await import('mongoose')).default;
    if (!mongoose.Types.ObjectId.isValid(id)) {
       return NextResponse.json({ success: false, message: 'Invalid ID format' }, { status: 400 });
    }

    const validStages = [
      'Applied',
      'Assessment Completed',
      'Shortlisted for next round',
      'Interview Scheduled',
      'Interview Cleared',
      'Offer Released',
      'Joined',
      'Rejected'
    ];

    if (stage && !validStages.includes(stage)) {
      return NextResponse.json({ success: false, message: 'Invalid pipeline stage' }, { status: 400 });
    }

    await dbConnect();

    // Find the HR's Company
    let hrCompany;
    if (decoded.role === 'hr_company') {
      hrCompany = await Company.findOne({ userId: decoded.id });
    } else {
      hrCompany = await Company.findById(decoded.id);
    }
    
    if (!hrCompany) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    
    // Find the application and make sure it belongs to the HR's company
    const application = await JobApplication.findById(id);

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    if (application.companyId.toString() !== hrCompany._id.toString()) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Update fields
    if (stage) application.stage = stage;
    if (interviewDate) application.interviewDate = interviewDate;
    if (meetingLink) application.meetingLink = meetingLink;
    if (feedback) application.feedback = feedback;

    await application.save();

    // Trigger Notifications here (Mock for Email/SMS)
    if (stage === 'Interview Scheduled') {
      console.log(`[MOCK EMAIL/SMS]: Interview scheduled for ${interviewDate}. Link: ${meetingLink}`);
    }

    return NextResponse.json({
      success: true,
      message: `Application updated to ${stage}`,
      application
    });

  } catch (error) {
    console.error('Update Application Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
