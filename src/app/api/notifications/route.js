import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const notifications = await Notification.find({ userId: decoded.id })
                                            .sort({ createdAt: -1 })
                                            .limit(20);

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
