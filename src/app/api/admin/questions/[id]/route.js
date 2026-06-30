import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const data = await request.json();

    // Basic Validation
    if (!data.domain || !data.level || !data.topic || !data.questionText || !data.options || data.options.length !== 4 || data.correctOptionIndex === undefined || !data.explanation) {
      return NextResponse.json({ success: false, message: 'Missing required fields or invalid options length' }, { status: 400 });
    }

    const question = await SelfAssessmentQuestion.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!question) {
      return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question updated successfully', question });

  } catch (error) {
    console.error('Update Question Error:', error);
    // Handle duplicate key error if they change domain/level/text to an existing one
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate question text in this domain/level already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    
    const question = await SelfAssessmentQuestion.findByIdAndDelete(id);

    if (!question) {
      return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Delete Question Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
