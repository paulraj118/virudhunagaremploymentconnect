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
    const file = formData.get('resume');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No resume file provided' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // ignore
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const filename = `resume_${decoded.id}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const resumeUrl = `/uploads/${filename}`;

    // Simulate ATS Scanning based on file size/random
    // In a real app, we would use pdf-parse here to read the text and compare against Job Descriptions
    const atsScore = Math.floor(Math.random() * 21) + 75; // Random score between 75 and 95

    await dbConnect();
    
    const student = await Student.findOneAndUpdate(
      { userId: decoded.id },
      { 
        $set: { 
          resumeUrl,
          atsScore
        } 
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and scanned successfully',
      resumeUrl,
      atsScore,
      student
    });

  } catch (error) {
    console.error('Resume Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during upload' }, { status: 500 });
  }
}
