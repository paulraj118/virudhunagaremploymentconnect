import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import dbConnect from '@/lib/mongodb';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    let matchQuery = { isDeleted: false };
    
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
      matchQuery.$or = [{ companyId: company._id }, { companyId: null }];
    }

    // Main stats aggregation
    const stats = await QuestionBank.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending Review'] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] } },
          aiGenerated: { $sum: { $cond: ['$isAiGenerated', 1, 0] } },
          manual: { $sum: { $cond: [{ $eq: ['$isAiGenerated', false] }, 1, 0] } },
          aiBySource: { $sum: { $cond: [{ $eq: ['$source', 'AI'] }, 1, 0] } },
          manualBySource: { $sum: { $cond: [{ $eq: ['$source', 'Manual'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || { total: 0, approved: 0, pending: 0, archived: 0, aiGenerated: 0, manual: 0, aiBySource: 0, manualBySource: 0 };

    // Domain breakdown
    const byDomain = await QuestionBank.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending Review'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Most used questions
    const mostUsed = await QuestionBank.find({ ...matchQuery, usageCount: { $gt: 0 } })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('content.questionText content.title type domain usageCount lastUsedAt')
      .lean();

    // Least used (approved but never used)
    const leastUsed = await QuestionBank.find({ ...matchQuery, status: 'Approved', usageCount: 0 })
      .sort({ createdAt: 1 })
      .limit(5)
      .select('content.questionText content.title type domain usageCount')
      .lean();

    return NextResponse.json({
      success: true,
      stats: {
        ...result,
        byDomain: byDomain.filter(d => d._id),
        mostUsed,
        leastUsed
      }
    });

  } catch (error) {
    console.error('Fetch Question Bank Stats Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
