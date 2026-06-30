import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import College from '@/models/College';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || !['super_admin', 'college'].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const track = searchParams.get('track') || '';
    const domain = searchParams.get('domain') || '';
    const minScore = parseInt(searchParams.get('minScore')) || 0;

    let matchQuery = { enrollmentStatus: 'approved' }; // Only rank approved students? Or all? Let's say all, or no filter. We'll leave it open but typically ranking is for approved students.

    if (decoded.role === 'college') {
      const college = await College.findById(decoded.id);
      if (!college) return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
      matchQuery.collegeName = college.collegeName;
    }

    if (track) matchQuery.industryTrack = track;
    if (domain) matchQuery.preferredDomain = domain;

    // Build the aggregation pipeline to calculate Employability Score dynamically
    const pipeline = [
      { $match: matchQuery },
      
      // Lookup User details for Name, Email, Mobile
      { $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: "$user" },

      // Lookup latest Assessment Result
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
      
      // Calculate fields
      { $addFields: {
          assessment: { $arrayElemAt: ["$latestAssessment", 0] },
      }},

      { $addFields: {
          // 1. Assessment Score (40%)
          scoreAssessment: { $multiply: [{ $ifNull: ["$assessment.percentage", 0] }, 0.40] },
          
          // 2. Readiness Level (20%)
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

          // 3. Domain Match (15%)
          scoreDomain: {
            $cond: [
              { $and: [
                { $ne: [{ $type: "$assessment" }, "missing"] },
                { $eq: ["$assessment.preferredDomain", "$preferredDomain"] }
              ]}, 15, 0
            ]
          },

          // 4. Track Match (10%)
          scoreTrack: {
            $cond: [
              { $and: [
                { $ne: [{ $type: "$assessment" }, "missing"] },
                { $eq: ["$assessment.industryTrack", "$industryTrack"] }
              ]}, 10, 0
            ]
          },

          // 5. Profile Completion (10%)
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

          // 6. Recent Assessment (5%) - Just award 5 if they have a completed assessment
          scoreRecent: {
            $cond: [{ $ne: [{ $type: "$assessment" }, "missing"] }, 5, 0]
          }
      }},

      { $addFields: {
          employabilityScore: {
            $add: [
              "$scoreAssessment", "$scoreReadiness", "$scoreDomain", 
              "$scoreTrack", "$scoreProfile", "$scoreRecent"
            ]
          }
      }},

      // Filter by min employability score
      { $match: { employabilityScore: { $gte: minScore } } },
      
      // Sort by employability score descending
      { $sort: { employabilityScore: -1 } },

      // Facet for pagination and metadata
      { $facet: {
          metadata: [ { $count: "total" } ],
          data: [ { $skip: skip }, { $limit: limit } ]
      }}
    ];

    const results = await Student.aggregate(pipeline);
    
    const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
    const candidates = results[0].data;

    // Lookup Shortlists for this user
    const Shortlist = (await import('@/models/Shortlist')).default;
    const shortlists = await Shortlist.find({
      shortlistedById: decoded.id,
      studentId: { $in: candidates.map(c => c._id) }
    }).select('studentId');
    const shortlistedIds = shortlists.map(s => s.studentId.toString());

    // Format output
    const formatted = candidates.map(c => {
      let readinessStr = 'Not Assessed';
      if (c.assessment) {
        if (c.assessment.percentage >= 85) readinessStr = 'Job Ready';
        else if (c.assessment.percentage >= 70) readinessStr = 'Advanced';
        else if (c.assessment.percentage >= 50) readinessStr = 'Intermediate';
        else readinessStr = 'Beginner';
      }

      return {
        _id: c._id,
        name: c.user.name,
        email: c.user.email,
        college: c.collegeName,
        department: c.department,
        preferredDomain: c.preferredDomain || 'N/A',
        industryTrack: c.industryTrack || 'N/A',
        employabilityScore: Math.round(c.employabilityScore),
        assessmentScore: c.assessment ? c.assessment.percentage : 0,
        readinessLevel: readinessStr,
        isShortlisted: shortlistedIds.includes(c._id.toString())
      };
    });

    return NextResponse.json({
      success: true,
      candidates: formatted,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Candidate Ranking API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
