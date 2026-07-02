import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import College from '@/models/College';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'college') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { validateCollegeApproval } = await import('@/lib/collegeAuth');
    const authCheck = await validateCollegeApproval(decoded.id);
    if (!authCheck.success) {
      return NextResponse.json(authCheck, { status: authCheck.status });
    }

    await dbConnect();
    const college = authCheck.college;
    
    // We can reuse the ranking logic to get all stats accurately
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin;
    
    // Fetch all candidates for this college via our ranking API to get employability scores
    // Note: Calling an internal API is okay, but aggregating directly is faster. 
    // Since Employability is calculated on the fly, we will do a massive pipeline here or reuse the logic.
    // For simplicity, let's call the internal API (or extract the logic, but fetching internally is easiest since cookies might be missing if we use fetch directly).
    // Better to replicate the pipeline without pagination.

    const pipeline = [
      { $match: { collegeName: college.collegeName, enrollmentStatus: 'approved' } },
      
      { $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: "$user" },

      { $lookup: {
          from: 'selfassessmentresults',
          let: { sId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$studentId", "$$sId"] }, status: 'completed' } },
            { $sort: { completionDate: -1 } },
            { $limit: 1 }
          ],
          as: 'latestAssessment'
      }},
      
      { $addFields: {
          assessment: { $arrayElemAt: ["$latestAssessment", 0] },
      }},

      { $addFields: {
          scoreAssessment: { $multiply: [{ $ifNull: ["$assessment.percentage", 0] }, 0.40] },
          scoreReadiness: {
            $switch: {
              branches: [
                { case: { $gte: ["$assessment.percentage", 85] }, then: 20 },
                { case: { $gte: ["$assessment.percentage", 70] }, then: 15 },
                { case: { $gte: ["$assessment.percentage", 50] }, then: 10 },
                { case: { $gte: ["$assessment.percentage", 0] }, then: 5 }
              ],
              default: 0
            }
          },
          scoreDomain: {
            $cond: [
              { $and: [
                { $ne: [{ $type: "$assessment" }, "missing"] },
                { $eq: ["$assessment.preferredDomain", "$preferredDomain"] }
              ]}, 15, 0
            ]
          },
          scoreTrack: {
            $cond: [
              { $and: [
                { $ne: [{ $type: "$assessment" }, "missing"] },
                { $eq: ["$assessment.industryTrack", "$industryTrack"] }
              ]}, 10, 0
            ]
          },
          scoreProfile: {
            $add: [
              { $cond: [{ $ifNull: ["$user.name", false] }, 1, 0] },
              { $cond: [{ $ifNull: ["$user.email", false] }, 1, 0] },
              { $cond: [{ $ifNull: ["$user.mobile", false] }, 1, 0] },
              { $cond: [{ $ifNull: ["$degree", false] }, 1, 0] },
              { $cond: [{ $ifNull: ["$department", false] }, 1, 0] },
              { $cond: [{ $gt: [{ $size: { $ifNull: ["$skills", []] } }, 0] }, 2, 0] },
              { $cond: [{ $ifNull: ["$resumeUrl", false] }, 1, 0] },
              { $cond: [{ $ifNull: ["$preferredDomain", false] }, 1, 0] },
              { $cond: [{ $ifNull: ["$industryTrack", false] }, 1, 0] }
            ]
          },
          scoreRecent: {
            $cond: [{ $ne: [{ $type: "$assessment" }, "missing"] }, 5, 0]
          }
      }},

      { $addFields: {
          employabilityScore: {
            $add: [ "$scoreAssessment", "$scoreReadiness", "$scoreDomain", "$scoreTrack", "$scoreProfile", "$scoreRecent" ]
          }
      }},

      // Calculate aggregated metrics
      { $group: {
          _id: null,
          totalRegistered: { $sum: 1 },
          completedAssessment: { $sum: { $cond: [{ $ne: [{ $type: "$assessment" }, "missing"] }, 1, 0] } },
          avgAssessmentScore: { $avg: "$assessment.percentage" },
          avgEmployabilityScore: { $avg: "$employabilityScore" },
          jobReady: { $sum: { $cond: [{ $gte: ["$assessment.percentage", 85] }, 1, 0] } },
          advanced: { $sum: { $cond: [{ $and: [{ $gte: ["$assessment.percentage", 70] }, { $lt: ["$assessment.percentage", 85] }] }, 1, 0] } },
          intermediate: { $sum: { $cond: [{ $and: [{ $gte: ["$assessment.percentage", 50] }, { $lt: ["$assessment.percentage", 70] }] }, 1, 0] } },
          beginner: { $sum: { $cond: [{ $and: [{ $gte: ["$assessment.percentage", 0] }, { $lt: ["$assessment.percentage", 50] }] }, 1, 0] } }
      }}
    ];

    const results = await Student.aggregate(pipeline);
    
    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalRegistered: 0, completedAssessment: 0, avgAssessmentScore: 0, avgEmployabilityScore: 0,
          jobReady: 0, advanced: 0, intermediate: 0, beginner: 0
        }
      });
    }

    const stats = results[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistered: stats.totalRegistered,
        completedAssessment: stats.completedAssessment,
        avgAssessmentScore: Math.round(stats.avgAssessmentScore || 0),
        avgEmployabilityScore: Math.round(stats.avgEmployabilityScore || 0),
        jobReady: stats.jobReady,
        advanced: stats.advanced,
        intermediate: stats.intermediate,
        beginner: stats.beginner
      }
    });

  } catch (error) {
    console.error('College Dashboard API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
