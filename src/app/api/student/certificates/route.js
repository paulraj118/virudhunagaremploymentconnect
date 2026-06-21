import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('certificate');
    const name = formData.get('name') || 'Untitled Certificate';
    const issuedBy = formData.get('issuedBy') || 'Unknown';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No certificate file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const filename = `cert_${decoded.id}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    await dbConnect();
    
    // Store in FileStore instead of local file system
    const { default: FileStore } = await import('@/models/FileStore');
    const newFile = await FileStore.create({
      buffer,
      contentType: file.type || 'application/pdf',
      filename
    });

    const fileUrl = `/api/file/${newFile._id}`;
    
    // Add to student certificates array
    const student = await Student.findOneAndUpdate(
      { userId: decoded.id },
      { 
        $push: { 
          certificates: {
            name,
            issuedBy,
            fileUrl,
            date: new Date()
          }
        } 
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Certificate uploaded successfully',
      certificates: student.certificates
    });

  } catch (error) {
    console.error('Certificate Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during upload' }, { status: 500 });
  }
}
