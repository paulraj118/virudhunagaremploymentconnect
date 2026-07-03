import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import College from '@/models/College';
import { getCurrentUser } from '@/lib/auth';
import { validateCollegeApproval } from '@/lib/collegeAuth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const approvalCheck = await validateCollegeApproval(decoded.id);
    if (!approvalCheck.success) {
      return NextResponse.json(
        { success: false, message: approvalCheck.message },
        { status: approvalCheck.status }
      );
    }

    await dbConnect();
    const college = await College.findById(decoded.id).select('-password');

    if (!college) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, college });
  } catch (error) {
    console.error('Fetch College Profile Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const approvalCheck = await validateCollegeApproval(decoded.id);
    if (!approvalCheck.success) {
      return NextResponse.json(
        { success: false, message: approvalCheck.message },
        { status: approvalCheck.status }
      );
    }

    await dbConnect();
    const data = await request.json();

    // Only allow updating specific fields (not password, role, approvalStatus)
    const allowedFields = ['collegeName', 'contactPerson', 'mobile', 'address', 'district', 'state'];
    const updateData = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    const college = await College.findByIdAndUpdate(decoded.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!college) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, college, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update College Profile Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
