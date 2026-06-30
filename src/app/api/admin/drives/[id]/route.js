import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import DriveApplication from '@/models/DriveApplication';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    
    // params.id might need await depending on Next.js version, but in generic App Router it is passed directly or awaited
    const { id } = await params;

    const drive = await RecruitmentDrive.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    if (!drive) {
      return NextResponse.json({ success: false, message: 'Drive not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, drive, message: 'Drive updated successfully' });
  } catch (error) {
    console.error('Update Drive Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const drive = await RecruitmentDrive.findByIdAndDelete(id);
    if (!drive) {
      return NextResponse.json({ success: false, message: 'Drive not found' }, { status: 404 });
    }

    // Delete associated applications
    await DriveApplication.deleteMany({ driveId: id });

    return NextResponse.json({ success: true, message: 'Drive deleted successfully' });
  } catch (error) {
    console.error('Delete Drive Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
