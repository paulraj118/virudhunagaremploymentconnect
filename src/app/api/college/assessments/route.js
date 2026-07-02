import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
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

    // 1. Get the logged-in college details
    const college = authCheck.college;
    if (!college) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    // 2. Build a normalized regex pattern for College Name matching
    // - Escapes special regex characters
    // - Replaces spaces with \s+ to match multiple spaces
    // - Wraps with ^\s* and \s*$ to ignore leading/trailing spaces
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizedName = college.collegeName.trim().replace(/\s+/g, ' ');
    const regexPattern = '^\\s*' + escapeRegExp(normalizedName).replace(/\\ /g, '\\s+') + '\\s*$';

    // 3. Fetch assessment results for students enrolled in this college
    const pipeline = [
      // Lookup Student collection
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        }
      },
      { $unwind: '$student' },
      
      // Strict isolation: Match only students from THIS college (normalized, case-insensitive)
      {
        $match: {
          'student.collegeName': { $regex: regexPattern, $options: 'i' }
        }
      },

      // Lookup User collection to get name and email
      {
        $lookup: {
          from: 'users',
          localField: 'student.userId',
          foreignField: '_id',
          as: 'user',
        }
      },
      { $unwind: '$user' },

      // Sort by latest completed first
      { $sort: { completionDate: -1 } },

      // Project required fields to minimize payload
      {
        $project: {
          _id: 1,
          studentName: '$user.name',
          studentEmail: '$user.email',
          collegeName: '$student.collegeName',
          preferredDomain: 1,
          industryTrack: 1,
          status: 1,
          percentage: 1,
          completionDate: 1,
          timeTaken: 1,
          strengths: 1,
          weaknesses: 1,
          topicPerformance: 1,
          questions: 1,
          interviewReadiness: 1
        }
      }
    ];

    const assessments = await SelfAssessmentResult.aggregate(pipeline);

    return NextResponse.json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching college assessments:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
