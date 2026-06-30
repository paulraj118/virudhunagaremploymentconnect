import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Offer from '@/models/Offer';
import Student from '@/models/Student';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const student = await Student.findOne({ userId: decoded.id });
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    const offers = await Offer.find({ studentId: student._id })
      .populate('companyId', 'companyName')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error('Fetch Student Offers Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  // Not passing id through params, we can just use request body to be safe, or just make an ID route
  return NextResponse.json({ success: false, message: 'Use /[id] route' }, { status: 400 });
}
