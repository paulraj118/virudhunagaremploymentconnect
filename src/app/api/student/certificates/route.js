import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public/uploads/certificates');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // ignore
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const filename = `cert_${decoded.id}_${Date.now()}_${file.name.replace(/\\s+/g, '_')}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/certificates/${filename}`;

    await dbConnect();
    
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
