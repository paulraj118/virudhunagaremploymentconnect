import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Offer from '@/models/Offer';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

import mongoose from 'mongoose';
import Company from '@/models/Company';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
       return NextResponse.json({ success: false, message: 'Invalid ID format' }, { status: 400 });
    }

    const { status, remarks } = await request.json();
    
    await dbConnect();

    let companyId;
    if (decoded.role === 'hr_company') {
      const hrCompany = await Company.findOne({ userId: decoded.id });
      if (!hrCompany) {
        return NextResponse.json({ success: false, message: 'Company profile not found' }, { status: 404 });
      }
      companyId = hrCompany._id.toString();
    } else {
      companyId = decoded.id;
    }

    const offer = await Offer.findById(id);
    if (!offer || offer.companyId.toString() !== companyId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (status === 'Withdrawn') {
      offer.status = 'Withdrawn';
      await offer.save();

      await AuditTrail.create({
        applicationId: offer.applicationId,
        actorId: decoded.id,
        actorRole: 'company',
        newStatus: 'Offer Withdrawn',
        remarks: remarks || `Offer ${offer.offerId} withdrawn.`
      });

      await Notification.create({
        recipientId: offer.studentId.toString(),
        recipientRole: 'student',
        message: `Your offer (${offer.offerId}) has been withdrawn.`,
        type: 'offer_update',
        link: '/student/offers'
      });
    }

    return NextResponse.json({ success: true, message: 'Offer updated successfully' });
  } catch (error) {
    console.error('Update Offer Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
