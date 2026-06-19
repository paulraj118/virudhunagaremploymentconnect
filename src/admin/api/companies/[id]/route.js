import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // 'approved', 'rejected', 'suspended'

    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();
    
    const company = await Company.findByIdAndUpdate(
      id,
      { approvalStatus: status },
      { new: true }
    );

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Company successfully ${status}`,
      data: company
    });

  } catch (error) {
    console.error('Update Company Status Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
