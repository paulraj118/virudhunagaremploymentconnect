import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const companies = await Company.find().populate('userId', 'email mobile').sort({ createdAt: -1 });

    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.approvalStatus === 'approved').length;
    const pendingApprovals = companies.filter(c => c.approvalStatus === 'pending').length;

    return NextResponse.json({
      success: true,
      data: companies,
      stats: {
        totalCompanies,
        activeCompanies,
        pendingApprovals
      }
    });

  } catch (error) {
    console.error('Fetch Admin Companies Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
