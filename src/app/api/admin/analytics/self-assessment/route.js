import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 1. KPI Cards
    const totalQuestions = await SelfAssessmentQuestion.countDocuments();
    const totalAssessments = await SelfAssessmentResult.countDocuments({ status: 'completed' });
    
    const uniqueCandidatesAggr = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: "$studentId" } }
    ]);
    const totalCandidatesCompleted = uniqueCandidatesAggr.length;

    const scoresAggr = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: null,
        averageScore: { $avg: "$percentage" },
        highestScore: { $max: "$percentage" },
        lowestScore: { $min: "$percentage" }
      }}
    ]);

    const averageScore = scoresAggr[0] ? Math.round(scoresAggr[0].averageScore) : 0;
    const highestScore = scoresAggr[0] ? scoresAggr[0].highestScore : 0;
    const lowestScore = scoresAggr[0] ? scoresAggr[0].lowestScore : 0;

    // 2. Question Distribution (Low/Medium/High)
    const questionDistribution = await SelfAssessmentQuestion.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } }
    ]);

    // Format for charts: Capitalize name
    const formattedQuestionDist = questionDistribution.map(d => ({
      name: d.name.charAt(0).toUpperCase() + d.name.slice(1),
      value: d.value
    }));

    // 3. Domain Analytics (Total Domains, Insufficient Domains, and Assessments per domain)
    const domainQuestionCounts = await SelfAssessmentQuestion.aggregate([
      { $group: {
        _id: "$domain",
        total: { $sum: 1 },
        low: { $sum: { $cond: [{ $eq: ["$level", "low"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$level", "medium"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$level", "high"] }, 1, 0] } }
      }}
    ]);

    const domainAssessmentStats = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: "$preferredDomain",
        assessmentsCount: { $sum: 1 },
        averageScore: { $avg: "$percentage" }
      }}
    ]);

    const totalPreferredDomains = domainQuestionCounts.length;
    const insufficientDomains = domainQuestionCounts.filter(d => d.total < 240).length;

    // Merge Domain Stats
    const domainAnalytics = domainQuestionCounts.map(dq => {
      const astats = domainAssessmentStats.find(a => a._id === dq._id);
      return {
        domain: dq._id,
        totalQuestions: dq.total,
        lowQuestions: dq.low,
        mediumQuestions: dq.medium,
        highQuestions: dq.high,
        totalAssessments: astats ? astats.assessmentsCount : 0,
        averageScore: astats ? Math.round(astats.averageScore) : 0,
        insufficient: dq.total < 240
      };
    });

    // 4. Chart Data: Assessments by Industry Track
    const assessmentsByIndustry = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: { $ifNull: ["$industryTrack", "Unknown"] }, count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } },
      { $sort: { value: -1 } },
      { $limit: 10 } // Top 10
    ]);

    // 5. Chart Data: Candidate Score Distribution
    const scoreRanges = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $bucket: {
          groupBy: "$percentage",
          boundaries: [0, 40, 60, 80, 101],
          default: "Other",
          output: { count: { $sum: 1 } }
      }}
    ]);

    const formatRange = (id) => {
      if (id === 0) return '0-39% (Poor)';
      if (id === 40) return '40-59% (Average)';
      if (id === 60) return '60-79% (Good)';
      if (id === 80) return '80-100% (Excellent)';
      return id;
    };
    const scoreDistribution = scoreRanges.map(r => ({ name: formatRange(r._id), value: r.count }));

    // 6. Chart Data: Pass vs Fail Ratio
    const passFailAggr = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: "$passFail", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } }
    ]);

    // 7. Chart Data: Monthly Assessment Activity
    const monthlyActivity = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: { $ifNull: ["$completionDate", "$createdAt"] } } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 12 },
      { $project: { month: "$_id", assessments: "$count", _id: 0 } }
    ]);

    return NextResponse.json({
      success: true,
      kpis: {
        totalQuestions,
        totalAssessments,
        totalCandidatesCompleted,
        averageScore,
        highestScore,
        lowestScore,
        totalPreferredDomains,
        insufficientDomains
      },
      charts: {
        questionDistribution: formattedQuestionDist,
        assessmentsByDomain: domainAnalytics.map(d => ({ name: d.domain, value: d.totalAssessments })).filter(d => d.value > 0).sort((a,b) => b.value - a.value).slice(0, 10),
        assessmentsByIndustry,
        scoreDistribution,
        passFailRatio: passFailAggr,
        monthlyActivity
      },
      domainAnalytics
    });

  } catch (error) {
    console.error('Self Assessment Analytics Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
