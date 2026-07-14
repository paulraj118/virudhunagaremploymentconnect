import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 1. Weakest and Strongest Domains (based on average percentage)
    const domainStats = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: "$preferredDomain",
        averageScore: { $avg: "$percentage" },
        totalAssessments: { $sum: 1 }
      }},
      { $sort: { averageScore: -1 } }
    ]);

    const strongestDomains = domainStats.slice(0, 3).map(d => ({
      domain: d._id,
      score: Math.round(d.averageScore)
    }));

    const weakestDomains = [...domainStats].reverse().slice(0, 3).map(d => ({
      domain: d._id,
      score: Math.round(d.averageScore)
    }));

    // 2. Average Skill Gap by Domain (100 - averageScore)
    const averageSkillGap = domainStats.map(d => ({
      domain: d._id,
      gap: 100 - Math.round(d.averageScore)
    })).sort((a, b) => b.gap - a.gap);

    // 3. Most Common Weak Topics
    // We unwind the questions array, match incorrect answers, and group by topic
    const weakTopicsAggr = await SelfAssessmentResult.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: "$questions" },
      { $match: { "questions.isCorrect": false } },
      { $group: {
        _id: "$questions.topic",
        failureCount: { $sum: 1 }
      }},
      { $sort: { failureCount: -1 } },
      { $limit: 10 }
    ]);

    const mostCommonWeakTopics = weakTopicsAggr.map(t => ({
      topic: t._id,
      failures: t.failureCount
    }));

    // 4. Candidates Needing Improvement (score < 50%)
    const candidatesNeedingImprovement = await SelfAssessmentResult.find({
      status: 'completed',
      percentage: { $lt: 50 }
    })
    .populate({
      path: 'studentId',
      select: 'userId collegeName',
      populate: { path: 'userId', select: 'name email gender' }
    })
    .sort({ percentage: 1 })
    .limit(50)
    .lean();

    const improvementList = candidatesNeedingImprovement.map(c => ({
      name: c.studentId?.userId?.name || 'Unknown',
      email: c.studentId?.userId?.email || 'Unknown',
      collegeName: c.studentId?.collegeName || 'Unknown',
      gender: c.studentId?.userId?.gender || 'Not Specified',
      domain: c.preferredDomain,
      score: c.percentage,
      date: c.completionDate || c.createdAt,
      studentId: c.studentId?._id?.toString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        strongestDomains,
        weakestDomains,
        averageSkillGap,
        mostCommonWeakTopics,
        improvementList
      }
    });

  } catch (error) {
    console.error('Admin Skill Gap Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
