import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalTest from '@/models/TechnicalTest';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import Company from '@/models/Company';
import Job from '@/models/Job';
import { getCurrentUser } from '@/lib/auth';

// GET - View all candidate results for a specific Technical Test
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

    const test = await TechnicalTest.findOne({ _id: id, companyId: company._id });
    if (!test) {
      return NextResponse.json({ success: false, message: 'Technical Test not found', errors: ['Test does not exist or does not belong to your company'] }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const resultFilter = searchParams.get('result');

    const filter = { technicalTestId: id, companyId: company._id };
    if (resultFilter) filter.resultStatus = resultFilter;

    const attempts = await TechnicalAttempt.find(filter)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title role')
      .sort({ 'scores.totalScore': -1 });

    const summary = {
      totalAttempts: attempts.length,
      passed: attempts.filter(a => a.resultStatus === 'Pass').length,
      failed: attempts.filter(a => a.resultStatus === 'Fail').length,
      pending: attempts.filter(a => a.resultStatus === 'Pending').length,
      averageScore: attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.scores.totalScore, 0) / attempts.length * 100) / 100
        : 0
    };

    return NextResponse.json({
      success: true,
      message: `Found ${attempts.length} attempt(s)`,
      data: {
        test: {
          _id: test._id,
          jobRole: test.jobRole,
          totalMarks: test.totalMarks,
          passingMarks: test.passingMarks,
          duration: test.duration,
          sections: test.sections
        },
        summary,
        attempts
      }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Fetch Results Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
