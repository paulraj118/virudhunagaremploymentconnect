import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const degree = searchParams.get('degree') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    let matchQuery = { collegeName: college.collegeName };

    if (department) {
      matchQuery.department = department;
    }
    if (degree) {
      matchQuery.degree = degree;
    }
    if (status) {
      matchQuery.enrollmentStatus = status;
    }

    // Build aggregate pipeline to search on user fields (name, email)
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { registrationNumber: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Clone pipeline for count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Student.aggregate(countPipeline);
    const totalStudents = countResult[0]?.total || 0;

    // Apply pagination and projection
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          degree: 1,
          department: 1,
          cgpa: 1,
          activeArrears: 1,
          registrationNumber: 1,
          enrollmentStatus: 1,
          skills: 1,
          resumeUrl: 1,
          name: '$user.name',
          email: '$user.email',
          mobile: '$user.mobile',
        },
      }
    );

    const students = await Student.aggregate(pipeline);

    // Get unique departments and degrees for filters
    const filterOptions = await Student.aggregate([
      { $match: { collegeName: college.collegeName } },
      {
        $group: {
          _id: null,
          departments: { $addToSet: '$department' },
          degrees: { $addToSet: '$degree' },
        },
      },
    ]);

    const departments = filterOptions[0]?.departments || [];
    const degrees = filterOptions[0]?.degrees || [];

    // Fetch quick stats
    const totalRegistered = await Student.countDocuments({ collegeName: college.collegeName });
    const pendingCount = await Student.countDocuments({ collegeName: college.collegeName, enrollmentStatus: 'pending' });
    const approvedCount = await Student.countDocuments({ collegeName: college.collegeName, enrollmentStatus: 'approved' });

    return NextResponse.json({
      success: true,
      students,
      metrics: {
        totalRegistered,
        pendingCount,
        approvedCount,
      },
      pagination: {
        total: totalStudents,
        pages: Math.ceil(totalStudents / limit),
        currentPage: page,
        limit,
      },
      filters: {
        departments,
        degrees,
      },
    });
  } catch (error) {
    console.error('Fetch College Students Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
