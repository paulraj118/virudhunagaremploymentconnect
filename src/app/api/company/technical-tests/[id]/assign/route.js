import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalTest from '@/models/TechnicalTest';
import JobApplication from '@/models/JobApplication';
import Company from '@/models/Company';
import { getCurrentUser } from '@/lib/auth';

// POST - Assign a Published test to shortlisted candidates for a job
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

    if (test.status !== 'Published') {
      return NextResponse.json({ success: false, message: 'Only Published tests can be assigned to candidates', errors: ['Test status must be Published'] }, { status: 400 });
    }

    const body = await request.json();
    const { candidateIds } = body;

    let filter = {
      jobId: test.jobId,
      companyId: company._id,
      technicalTestStatus: 'Not Assigned'
    };

    if (candidateIds && candidateIds.length > 0) {
      filter._id = { $in: candidateIds };
    } else {
      filter.stage = { $in: ['Applied', 'Assessment Completed', 'Shortlisted'] };
    }

    const result = await JobApplication.updateMany(filter, {
      $set: {
        technicalTestId: test._id,
        technicalTestStatus: 'Assigned'
      }
    });

    const totalAssigned = await JobApplication.countDocuments({
      technicalTestId: test._id,
      technicalTestStatus: { $ne: 'Not Assigned' }
    });

    test.assignedCandidateCount = totalAssigned;
    test.updatedBy = decoded.id;
    await test.save();

    console.log(`[TECHNICAL-TEST] HR ${decoded.id} assigned Technical Test ${id} to ${result.modifiedCount} candidate(s). Total assigned: ${totalAssigned}`);

    return NextResponse.json({
      success: true,
      message: `Technical Test assigned to ${result.modifiedCount} candidate(s)`,
      data: { assignedCount: result.modifiedCount, totalAssigned }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Assign Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
