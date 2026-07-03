import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { validateCollegeApproval } = await import('@/lib/collegeAuth');
    const authCheck = await validateCollegeApproval(decoded.id);
    if (!authCheck.success) {
      return NextResponse.json(authCheck, { status: authCheck.status });
    }

    await dbConnect();
    const companies = await Company.find({ status: 'Approved' }).sort({ companyName: 1 });
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error('Fetch College Companies Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
