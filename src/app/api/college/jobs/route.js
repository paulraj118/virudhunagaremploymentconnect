import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Job from '@/models/Job';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch all active jobs
    const jobs = await Job.find({ isActive: true }).populate('companyId', 'companyName').sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      jobs: jobs
    });

  } catch (error) {
    console.error('Fetch College Jobs Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
