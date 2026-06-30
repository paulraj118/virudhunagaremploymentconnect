import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Offer from '@/models/Offer';
import Student from '@/models/Student';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json(); // 'Accepted' or 'Rejected'
    
    await dbConnect();
    const student = await Student.findOne({ userId: decoded.id });
    const offer = await Offer.findById(id);
    
    if (!offer || !student || offer.studentId.toString() !== student._id.toString()) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (!['Accepted', 'Rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    offer.status = status;
    await offer.save();

    await AuditTrail.create({
      applicationId: offer.applicationId,
      actorId: decoded.id,
      actorRole: 'student',
      newStatus: `Offer ${status}`,
      remarks: `Student ${status.toLowerCase()} the offer (${offer.offerId}).`
    });

    await Notification.create({
      recipientId: offer.companyId.toString(),
      recipientRole: 'company',
      message: `The candidate has ${status.toLowerCase()} your offer (${offer.offerId}).`,
      type: 'offer_response',
      link: '/company/offers'
    });

    return NextResponse.json({ success: true, message: `Offer ${status.toLowerCase()} successfully.` });
  } catch (error) {
    console.error('Update Offer Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
