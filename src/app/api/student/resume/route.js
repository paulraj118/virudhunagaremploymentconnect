import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { processAtsScore } from '@/lib/atsScorer';

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

    const baseResumeUrl = `/uploads/${filename}`;

    await dbConnect();
    const existingStudent = await Student.findOne({ userId: decoded.id });
    if (!existingStudent) {
      return NextResponse.json({
        success: true,
        message: 'Resume uploaded successfully. Score will be calculated upon enrollment submission.',
        resumeUrl: baseResumeUrl,
        atsScore: 0
      });
    }

    // Temporarily attach baseResumeUrl so processAtsScore can find it on disk if needed
    existingStudent.resumeUrl = baseResumeUrl;

    const { atsScore, resumeUrl: finalResumeUrl } = await processAtsScore(existingStudent, buffer);
    
    const student = await Student.findOneAndUpdate(
      { userId: decoded.id },
      { 
        $set: { 
          resumeUrl: finalResumeUrl,
          atsScore
        } 
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and scanned successfully',
      resumeUrl: finalResumeUrl,
      atsScore,
      student
    });

  } catch (error) {
    console.error('Resume Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during upload' }, { status: 500 });
  }
}

