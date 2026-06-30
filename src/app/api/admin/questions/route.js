import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const domain = searchParams.get('domain') || '';
    const level = searchParams.get('level') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const keyword = searchParams.get('keyword') || '';

    const query = {};

    if (domain) query.domain = domain;
    if (level) query.level = level;
    if (difficulty) query.difficulty = difficulty;

    if (keyword) {
      query.$or = [
        { questionText: { $regex: keyword, $options: 'i' } },
        { topic: { $regex: keyword, $options: 'i' } },
        { domain: { $regex: keyword, $options: 'i' } }
      ];
    }

    const questions = await SelfAssessmentQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SelfAssessmentQuestion.countDocuments(query);

    return NextResponse.json({
      success: true,
      questions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Fetch Admin Questions Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();

    // Basic Validation
    if (!data.domain || !data.level || !data.topic || !data.questionText || !data.options || data.options.length !== 4 || data.correctOptionIndex === undefined || !data.explanation) {
      return NextResponse.json({ success: false, message: 'Missing required fields or invalid options length' }, { status: 400 });
    }

    // Check Duplicate
    const existing = await SelfAssessmentQuestion.exists({
      domain: data.domain,
      level: data.level,
      questionText: data.questionText
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Question already exists in this domain and level' }, { status: 409 });
    }

    const question = await SelfAssessmentQuestion.create(data);

    return NextResponse.json({ success: true, message: 'Question added successfully', question }, { status: 201 });

  } catch (error) {
    console.error('Add Question Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
