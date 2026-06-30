import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalTest from '@/models/TechnicalTest';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

// POST - Create a new Technical Test (Draft)
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized', errors: ['Authentication required with HR role'] }, { status: 401 });
    }

    await dbConnect();

    const company = await Company.findOne({ userId: decoded.id });
    if (!company || company.approvalStatus !== 'approved') {
      return NextResponse.json({ success: false, message: 'Company not approved', errors: ['Company must be approved to create tests'] }, { status: 403 });
    }

    const body = await request.json();
    const { jobId, jobRole, passingMarks, duration, sections } = body;

    // Validation
    const errors = [];
    if (!jobId) errors.push('jobId is required');
    if (!jobRole) errors.push('jobRole is required');
    if (!sections) errors.push('Test sections are required');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    // Validate section structure
    const { sectionA_MCQ, sectionB_FillBlanks, sectionC_Programming1, sectionD_Programming2 } = sections;

    if (!sectionA_MCQ || sectionA_MCQ.length !== 5) {
      errors.push('Section A must have exactly 5 MCQ questions');
    }
    if (!sectionB_FillBlanks || sectionB_FillBlanks.length !== 5) {
      errors.push('Section B must have exactly 5 Fill-in-the-Blank questions');
    }
    if (!sectionC_Programming1 || !sectionC_Programming1.title || !sectionC_Programming1.description) {
      errors.push('Section C programming question is required with title and description');
    }
    if (!sectionD_Programming2 || !sectionD_Programming2.title || !sectionD_Programming2.description) {
      errors.push('Section D programming question is required with title and description');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: 'Section validation failed', errors }, { status: 400 });
    }

    const technicalTest = await TechnicalTest.create({
      companyId: company._id,
      hrId: decoded.id,
      jobId,
      jobRole,
      totalMarks: 20,
      passingMarks: passingMarks || 12,
      duration: duration || 45,
      status: 'Draft',
      sections: {
        sectionA_MCQ,
        sectionB_FillBlanks,
        sectionC_Programming1,
        sectionD_Programming2
      },
      createdBy: decoded.id,
      updatedBy: decoded.id
    });

    console.log(`[TECHNICAL-TEST] HR ${decoded.id} created Technical Test ${technicalTest._id} (Draft) for role "${jobRole}" at company ${company._id}`);

    return NextResponse.json({
      success: true,
      message: 'Technical Test created as Draft',
      data: { test: technicalTest }
    }, { status: 201 });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Create Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}

// GET - List all Technical Tests for the HR's company
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized', errors: ['Authentication required with HR role'] }, { status: 401 });
    }

    await dbConnect();

    const company = await Company.findOne({ userId: decoded.id });
    if (!company) {
      return NextResponse.json({ success: false, message: 'Company profile not found', errors: ['No company linked to this account'] }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');

    // Company ownership: only fetch tests belonging to this company
    const filter = { companyId: company._id };
    if (status) filter.status = status;
    if (jobId) filter.jobId = jobId;

    const tests = await TechnicalTest.find(filter)
      .populate('jobId', 'title role')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      message: `Found ${tests.length} technical test(s)`,
      data: { tests, count: tests.length }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Fetch Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
