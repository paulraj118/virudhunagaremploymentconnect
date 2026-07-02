import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import Job from '@/models/Job';
import College from '@/models/College';
import Student from '@/models/Student';
import Offer from '@/models/Offer';

export async function GET() {
  try {
    await dbConnect();

    const [
      candidatesCount,
      companiesCount,
      jobsCount,
      collegesCount,
      offersCount
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      Company.countDocuments({ isDeleted: { $ne: true } }),
      Job.countDocuments({ isActive: true }),
      College.countDocuments({ approvalStatus: 'Approved' }),
      Offer.countDocuments({})
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        candidates: candidatesCount,
        companies: companiesCount,
        jobs: jobsCount,
        colleges: collegesCount,
        offers: offersCount
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
