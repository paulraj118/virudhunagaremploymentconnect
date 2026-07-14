import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalTest from '@/models/TechnicalTest';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

// POST - Publish a Draft test
export async function POST(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized', errors: ['Authentication required with HR role'] }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found', errors: ['No company linked to this account'] }, { status: 404 });
    }

    const test = await TechnicalTest.findOne({ _id: id, companyId: company._id });
    if (!test) {
      return NextResponse.json({ success: false, message: 'Technical Test not found', errors: ['Test does not exist or does not belong to your company'] }, { status: 404 });
    }

    if (test.status === 'Published') {
      return NextResponse.json({ success: false, message: 'Test is already published', errors: ['Cannot publish twice'] }, { status: 400 });
    }
    if (test.status === 'Archived') {
      return NextResponse.json({ success: false, message: 'Cannot publish an archived test', errors: ['Archive status is final'] }, { status: 400 });
    }

    // Validate completeness before publishing
    const errors = [];
    const { sectionA_MCQ, sectionB_FillBlanks, sectionC_Programming1, sectionD_Programming2 } = test.sections;

    if (!sectionA_MCQ || sectionA_MCQ.length !== 5) errors.push('Section A must have exactly 5 MCQ questions');
    if (!sectionB_FillBlanks || sectionB_FillBlanks.length !== 5) errors.push('Section B must have exactly 5 Fill-in-the-Blank questions');
    if (!sectionC_Programming1 || !sectionC_Programming1.title) errors.push('Section C programming question title is required');
    if (!sectionC_Programming1?.hiddenTestCases || sectionC_Programming1.hiddenTestCases.length < 1) errors.push('Section C must have at least 1 hidden test case');
    if (!sectionD_Programming2 || !sectionD_Programming2.title) errors.push('Section D programming question title is required');
    if (!sectionD_Programming2?.hiddenTestCases || sectionD_Programming2.hiddenTestCases.length < 1) errors.push('Section D must have at least 1 hidden test case');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: 'Test is incomplete and cannot be published', errors }, { status: 400 });
    }

    test.status = 'Published';
    test.publishedAt = new Date();
    test.updatedBy = decoded.id;
    await test.save();

    console.log(`[TECHNICAL-TEST] HR ${decoded.id} published Technical Test ${id} for role "${test.jobRole}" at company ${company._id}`);

    return NextResponse.json({
      success: true,
      message: 'Technical Test published successfully',
      data: { test }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Publish Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
