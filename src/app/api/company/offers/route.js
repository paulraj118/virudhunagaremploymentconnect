import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Offer from '@/models/Offer';
import DriveApplication from '@/models/DriveApplication';
import JobApplication from '@/models/JobApplication';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';
import User from '@/models/User';
import Company from '@/models/Company';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    let companyId;
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) {
        return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
      }
      companyId = company._id;
    } else {
      companyId = decoded.id;
    }

    const offers = await Offer.find({ companyId })
      .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', model: User, select: 'name email' } })
      .populate('driveId', 'jobRole')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error('Fetch Company Offers Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    await dbConnect();

    const data = {
      applicationId: formData.get('applicationId'),
      jobRole: formData.get('jobRole'),
      salaryPackage: formData.get('salaryPackage'),
      location: formData.get('location'),
      joiningDate: formData.get('joiningDate'),
      expiryDate: formData.get('expiryDate'),
      notes: formData.get('notes'),
    };

    // Get company profile
    let company;
    if (decoded.role === 'hr_company') {
      company = await Company.findOne({ userId: decoded.id });
    } else {
      company = await Company.findById(decoded.id);
    }

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
    }

    // Verify ownership for either DriveApplication or JobApplication
    let app = await DriveApplication.findById(data.applicationId);
    let appType = 'drive';
    if (!app) {
      app = await JobApplication.findById(data.applicationId);
      appType = 'job';
    }

    if (!app || app.companyId.toString() !== company._id.toString()) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    if (appType === 'drive' && app.status !== 'Selected') {
       app.status = 'Selected';
       await app.save();
    } else if (appType === 'job' && app.stage !== 'Offer Released') {
       app.stage = 'Offer Released';
       await app.save();
    }

    // Generate unique Offer ID
    const offerCount = await Offer.countDocuments();
    const offerId = `OFF-${new Date().getFullYear()}-${String(offerCount + 1).padStart(4, '0')}`;

    // Handle file upload if present
    const file = formData.get('offerLetter');
    let offerLetterUrl = '';
    
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { default: FileStore } = await import('@/models/FileStore');
      const newFile = await FileStore.create({
        buffer,
        contentType: file.type || 'application/pdf',
        filename: `offer_${offerId}.pdf`
      });
      offerLetterUrl = `/api/file/${newFile._id}`;
    }

    const offerData = {
      offerId,
      applicationId: app._id,
      companyId: company._id,
      studentId: app.studentId,
      jobRole: data.jobRole,
      salaryPackage: data.salaryPackage,
      location: data.location,
      joiningDate: data.joiningDate,
      expiryDate: data.expiryDate,
      notes: data.notes,
      offerLetterUrl
    };

    if (appType === 'drive') offerData.driveId = app.driveId;
    if (appType === 'job') offerData.jobId = app.jobId;

    const offer = await Offer.create(offerData);

    await AuditTrail.create({
      applicationId: app._id,
      actorId: decoded.id,
      actorRole: 'company',
      newStatus: 'Offer Released',
      remarks: `Offer ${offerId} generated.`
    });

    await Notification.create({
      recipientId: app.studentId.toString(),
      recipientRole: 'student',
      message: `Congratulations! An offer has been released for ${data.jobRole}.`,
      type: 'offer_update',
      link: '/student/offers'
    });

    return NextResponse.json({ success: true, offer, message: 'Offer generated successfully' });
  } catch (error) {
    console.error('Create Offer Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
