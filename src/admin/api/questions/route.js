import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { getCurrentUser } from '@/lib/auth';

// Fetch all questions
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    // Temporary bypass for testing purposes
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    
    let query = {};
    if (domain && domain !== 'All') {
      query.domain = domain;
    }

    const questions = await Question.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Fetch Questions Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Add a new question
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const body = await request.json();
    const { domain, questionText, options, correctOptionIndex, difficulty } = body;

    if (!domain || !questionText || !options || options.length !== 4 || correctOptionIndex === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const question = await Question.create({
      domain,
      questionText,
      options,
      correctOptionIndex,
      difficulty: difficulty || 'Medium'
    });

    return NextResponse.json({
      success: true,
      message: 'Question added successfully',
      question
    }, { status: 201 });

  } catch (error) {
    console.error('Add Question Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
