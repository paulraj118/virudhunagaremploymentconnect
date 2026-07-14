import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import AssessmentResult from '@/models/AssessmentResult';
import Student from '@/models/Student';
import Job from '@/models/Job';
import Company from '@/models/Company';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET: Fetch a single assessment result by ID (read-only, candidate-only)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const decoded = await getCurrentUser();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid report ID' }, { status: 400 });
    }

    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find the student profile for the logged-in user
    const student = await Student.findOne({ userId: decoded.id }).populate('userId', 'name email');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Fetch the assessment result
    const result = await AssessmentResult.findById(id);
    if (!result) {
      return NextResponse.json({ success: false, message: 'Assessment report not found' }, { status: 404 });
    }

    // Authorization: candidate can only view their own report
    if (result.studentId.toString() !== student._id.toString()) {
      return NextResponse.json({ success: false, message: 'Forbidden: You can only access your own report.' }, { status: 403 });
    }

    // Fetch job and company details if jobId exists
    let jobTitle = '';
    let companyName = '';
    let jobDepartment = '';

    if (result.jobId) {
      try {
        const job = await Job.findById(result.jobId);
        if (job) {
          jobTitle = job.title || '';
          jobDepartment = job.department || '';

          const company = await Company.findById(job.companyId);
          if (company) {
            companyName = company.companyName || '';
          }
        }
      } catch (e) {
        console.error('Error fetching job/company for report:', e);
      }
    }

    // Build the response using only existing stored data
    const reportData = {
      _id: result._id,
      candidateName: student.userId?.name || 'N/A',
      candidateEmail: student.userId?.email || 'N/A',
      collegeName: student.collegeName || 'N/A',
      department: student.department || 'N/A',
      jobTitle: jobTitle || 'Self Assessment',
      companyName: companyName || 'N/A',
      jobDepartment: jobDepartment || '',
      domain: result.domain || 'N/A',
      totalQuestions: result.totalQuestions || 0,
      correctAnswers: result.correctAnswers || 0,
      score: result.score || 0,
      percentage: result.percentage || 0,
      passFail: result.passFail || 'N/A',
      violations: result.violations || 0,
      autoSubmitted: result.autoSubmitted || false,
      loginTimestamp: result.loginTimestamp || null,
      submissionTimestamp: result.submissionTimestamp || result.createdAt,
      questions: result.questions || [],
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      suggestions: result.suggestions || [],
      interviewReadiness: result.interviewReadiness || 0,
      confidenceLevel: result.confidenceLevel || 'Low',
      suggestedStudyTime: result.suggestedStudyTime || '',
      overallRecommendation: result.overallRecommendation || '',
      createdAt: result.createdAt,
    };

    return NextResponse.json({ success: true, report: reportData });

  } catch (error) {
    console.error('Fetch Assessment Report Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
