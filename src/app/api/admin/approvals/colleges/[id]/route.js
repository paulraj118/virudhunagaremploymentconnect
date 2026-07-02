import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const { action } = await request.json(); // 'approve' or 'reject'

    let newStatus = '';
    if (action === 'approve') {
      newStatus = 'Approved';
    } else if (action === 'reject') {
      newStatus = 'Rejected';
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    const updatedCollege = await College.findByIdAndUpdate(
      id,
      { 
        $set: { 
          approvalStatus: newStatus,
          approvalDate: newStatus === 'Approved' ? new Date() : undefined
        } 
      },
      { new: true }
    );

    if (!updatedCollege) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `College ${newStatus} successfully` });
  } catch (error) {
    console.error('Update College Approval Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
