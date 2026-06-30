import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shortlist from '@/models/Shortlist';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || !['super_admin', 'college'].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { studentId, action } = await request.json();

    if (!studentId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    const type = decoded.role === 'super_admin' ? 'Admin' : 'College';

    if (action === 'add') {
      await Shortlist.updateOne(
        { studentId, shortlistedByType: type, shortlistedById: decoded.id },
        { $set: { studentId, shortlistedByType: type, shortlistedById: decoded.id } },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: 'Candidate shortlisted' });
    } else {
      await Shortlist.deleteOne({ studentId, shortlistedByType: type, shortlistedById: decoded.id });
      return NextResponse.json({ success: true, message: 'Shortlist removed' });
    }

  } catch (error) {
    console.error('Shortlist API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
