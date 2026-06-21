import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FileStore from '@/models/FileStore';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    await dbConnect();
    
    // In Next.js 14 params is an object, in Next.js 15 it's a Promise.
    // Handling both safely.
    const params = await Promise.resolve(context.params);
    const fileId = params.id;

    const fileData = await FileStore.findById(fileId);
    
    if (!fileData) {
      return new NextResponse('File not found', { status: 404 });
    }

    return new NextResponse(fileData.buffer, {
      status: 200,
      headers: {
        'Content-Type': fileData.contentType,
        'Content-Disposition': `inline; filename="${fileData.filename}"`,
      },
    });
  } catch (error) {
    console.error('File fetch error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
