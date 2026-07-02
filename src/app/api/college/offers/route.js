import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Offer from '@/models/Offer';
import College from '@/models/College';
import User from '@/models/User';
import Student from '@/models/Student';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Get the college's profile to get the exact college name
    const college = await College.findOne({ userId: decoded.id });
    if (!college || !college.collegeName) {
      return NextResponse.json({ success: false, message: 'College profile not found' }, { status: 404 });
    }

    const exactCollegeName = college.collegeName;

    // Find students belonging to this exact college name
    const students = await Student.find({ collegeName: exactCollegeName }, '_id userId');
    const studentIds = students.map(s => s._id);

    // Fetch offers for those students
    const offers = await Offer.find({ studentId: { $in: studentIds } })
      .populate({ path: 'companyId', select: 'companyName', model: Company })
      .populate({ path: 'studentId', select: 'userId collegeName', model: Student, populate: { path: 'userId', model: User, select: 'name' } })
      .sort({ createdAt: -1 })
      .lean();

    // Map to restricted format (Data Minimization for privacy & security)
    const secureOffers = offers.map(offer => ({
      _id: offer._id,
      offerId: offer.offerId,
      studentName: offer.studentId?.userId?.name || 'Unknown',
      companyName: offer.companyId?.companyName || 'Unknown Company',
      jobRole: offer.jobRole,
      salaryPackage: offer.salaryPackage,
      joiningDate: offer.joiningDate,
      status: offer.status,
      offerLetterUrl: offer.offerLetterUrl,
      createdAt: offer.createdAt
    }));

    return NextResponse.json({ success: true, offers: secureOffers });
  } catch (error) {
    console.error('Fetch College Offers Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
