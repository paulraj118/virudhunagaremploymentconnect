import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Offer from '@/models/Offer';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import Student from '@/models/Student';
import User from '@/models/User';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const offers = await Offer.find()
      .populate({ 
        path: 'studentId', 
        model: Student,
        select: 'userId collegeName', 
        populate: { 
          path: 'userId', 
          model: User, 
          select: 'name email gender' 
        } 
      })
      .populate({ path: 'companyId', model: Company, select: 'companyName' })
      .sort({ createdAt: -1 })
      .lean();

    const formattedOffers = offers.map(off => ({
      ...off,
      studentName: off.studentId?.userId?.name || 'Unknown',
      collegeName: off.studentId?.collegeName || 'Unknown',
      gender: off.studentId?.userId?.gender || 'Not Specified',
      email: off.studentId?.userId?.email || '',
    }));

    return NextResponse.json({ success: true, offers: formattedOffers });
  } catch (error) {
    console.error('Fetch Admin Offers Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
