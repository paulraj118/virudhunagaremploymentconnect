import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { notificationId } = await request.json();
    await dbConnect();

    if (notificationId === 'all') {
      await Notification.updateMany({ userId: decoded.id }, { isRead: true });
    } else {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
