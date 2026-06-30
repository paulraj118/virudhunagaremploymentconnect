import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalTest from '@/models/TechnicalTest';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

// GET - Get a single Technical Test by ID
export async function GET(request, { params }) {
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

    // Company ownership check
    const test = await TechnicalTest.findOne({ _id: id, companyId: company._id })
      .populate('jobId', 'title role');

    if (!test) {
      return NextResponse.json({ success: false, message: 'Technical Test not found', errors: ['Test does not exist or does not belong to your company'] }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Technical Test retrieved', data: { test } });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Fetch Single Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}

// PUT - Update an existing Technical Test
export async function PUT(request, { params }) {
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

    // Company ownership check
    const test = await TechnicalTest.findOne({ _id: id, companyId: company._id });
    if (!test) {
      return NextResponse.json({ success: false, message: 'Technical Test not found', errors: ['Test does not exist or does not belong to your company'] }, { status: 404 });
    }

    if (test.status === 'Published' && test.completedCandidateCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot edit a Published test that already has completed attempts. Archive it and create a new one.',
        errors: ['Test has completed attempts']
      }, { status: 400 });
    }

    const body = await request.json();
    const { jobRole, passingMarks, duration, sections } = body;

    // Validate sections if provided
    if (sections) {
      const errors = [];
      const { sectionA_MCQ, sectionB_FillBlanks, sectionC_Programming1, sectionD_Programming2 } = sections;

      if (sectionA_MCQ && sectionA_MCQ.length !== 5) errors.push('Section A must have exactly 5 MCQ questions');
      if (sectionB_FillBlanks && sectionB_FillBlanks.length !== 5) errors.push('Section B must have exactly 5 Fill-in-the-Blank questions');

      if (errors.length > 0) {
        return NextResponse.json({ success: false, message: 'Section validation failed', errors }, { status: 400 });
      }

      if (sectionA_MCQ) test.sections.sectionA_MCQ = sectionA_MCQ;
      if (sectionB_FillBlanks) test.sections.sectionB_FillBlanks = sectionB_FillBlanks;
      if (sectionC_Programming1) test.sections.sectionC_Programming1 = sectionC_Programming1;
      if (sectionD_Programming2) test.sections.sectionD_Programming2 = sectionD_Programming2;
    }

    if (jobRole) test.jobRole = jobRole;
    if (passingMarks) test.passingMarks = passingMarks;
    if (duration) test.duration = duration;
    test.updatedBy = decoded.id;

    await test.save();

    console.log(`[TECHNICAL-TEST] HR ${decoded.id} updated Technical Test ${id} at company ${company._id}`);

    return NextResponse.json({
      success: true,
      message: 'Technical Test updated successfully',
      data: { test }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Update Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}

// DELETE - Delete a Technical Test (only if Draft or no attempts)
export async function DELETE(request, { params }) {
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

    // Company ownership check
    const test = await TechnicalTest.findOne({ _id: id, companyId: company._id });
    if (!test) {
      return NextResponse.json({ success: false, message: 'Technical Test not found', errors: ['Test does not exist or does not belong to your company'] }, { status: 404 });
    }

    if (test.assignedCandidateCount > 0 || test.completedCandidateCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete a test that has been assigned or attempted. Archive it instead.',
        errors: ['Test has assigned or completed candidates']
      }, { status: 400 });
    }

    await TechnicalTest.findByIdAndDelete(id);

    console.log(`[TECHNICAL-TEST] HR ${decoded.id} deleted Technical Test ${id} at company ${company._id}`);

    return NextResponse.json({
      success: true,
      message: 'Technical Test deleted successfully',
      data: {}
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Delete Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
