import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    await dbConnect();
    
    // Lazy load FileStore model
    const { default: FileStore } = await import('@/models/FileStore');
    const newFile = await FileStore.create({
      buffer,
      contentType: file.type || 'application/octet-stream',
      filename
    });

    return NextResponse.json({
      success: true,
      fileUrl: `/api/file/${newFile._id}`,
      filename: file.name
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during upload' }, { status: 500 });
  }
}
