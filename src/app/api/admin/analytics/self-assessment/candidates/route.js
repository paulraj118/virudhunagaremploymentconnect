import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import Student from '@/models/Student';
import User from '@/models/User';
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

    const keyword = searchParams.get('keyword') || '';
    const domain = searchParams.get('domain') || '';
    const track = searchParams.get('track') || '';
    const collegeName = searchParams.get('collegeName') || '';
    const status = searchParams.get('status') || '';
    const scoreRange = searchParams.get('scoreRange') || '';
    const date = searchParams.get('date') || '';
    const sortBy = searchParams.get('sortBy') || 'latest';
    const isExport = searchParams.get('export') === 'true';

    const pipeline = [];

    // 1. Initial direct field matching
    let initialMatch = {};
    if (domain) initialMatch.preferredDomain = { $regex: domain, $options: 'i' };
    if (track) initialMatch.industryTrack = { $regex: track, $options: 'i' };
    if (status) initialMatch.status = status;
    
    if (scoreRange) {
      const [min, max] = scoreRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        initialMatch.percentage = { $gte: min, $lte: max };
      }
    }
    
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate)) {
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);
        initialMatch.completionDate = { $gte: targetDate, $lt: nextDay };
      }
    }

    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch });
    }

    // 2. Lookup related documents
    pipeline.push({
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'studentInfo'
      }
    });
    pipeline.push({ $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'studentInfo.userId',
        foreignField: '_id',
        as: 'userInfo'
      }
    });
    pipeline.push({ $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } });

    // 3. Post-lookup matching (keyword & college)
    let postMatch = {};
    if (collegeName) {
      postMatch['studentInfo.collegeName'] = { $regex: collegeName, $options: 'i' };
    }
    if (keyword) {
      postMatch['$or'] = [
        { 'userInfo.name': { $regex: keyword, $options: 'i' } },
        { 'userInfo.email': { $regex: keyword, $options: 'i' } }
      ];
    }
    
    if (Object.keys(postMatch).length > 0) {
      pipeline.push({ $match: postMatch });
    }

    // 4. Sorting
    let sortStage = { completionDate: -1, createdAt: -1 };
    if (sortBy === 'highest_score') sortStage = { percentage: -1, completionDate: -1 };
    else if (sortBy === 'lowest_score') sortStage = { percentage: 1, completionDate: -1 };
    else if (sortBy === 'candidate_name') sortStage = { 'userInfo.name': 1, completionDate: -1 };
    else if (sortBy === 'college_name') sortStage = { 'studentInfo.collegeName': 1, completionDate: -1 };
    
    pipeline.push({ $sort: sortStage });

    // 5. Facet for pagination and metadata
    let facetStage = {
      metadata: [ { $count: 'total' } ],
      data: []
    };

    if (!isExport) {
      facetStage.data.push({ $skip: skip }, { $limit: limit });
    }

    pipeline.push({ $facet: facetStage });

    const [aggResult] = await SelfAssessmentResult.aggregate(pipeline);
    
    const results = aggResult?.data || [];
    const total = aggResult?.metadata?.[0]?.total || 0;

    // Format for frontend
    const candidates = results.map(r => ({
      _id: r._id,
      name: r.userInfo?.name || 'Unknown',
      email: r.userInfo?.email || 'Unknown',
      collegeName: r.studentInfo?.collegeName || 'Unknown',
      domain: r.preferredDomain || 'Unknown',
      track: r.industryTrack || 'Unknown',
      date: r.completionDate || r.createdAt,
      status: r.status,
      score: r.percentage,
      level: r.level || r.overallLevel,
      result: r.passFail,
      fullReport: r // Contains questions, answers, strengths, weaknesses, etc.
    }));

    return NextResponse.json({
      success: true,
      candidates,
      total,
      page,
      pages: isExport ? 1 : Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Candidate Analytics Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

