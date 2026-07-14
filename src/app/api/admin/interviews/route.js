import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import Student from '@/models/Student';
import User from '@/models/User';
import Job from '@/models/Job';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all student profiles to resolve candidateId -> Student (College, Gender, etc.)
    const studentsList = await Student.find().populate('userId', 'name email gender').lean();
    const studentByUserIdMap = {};
    studentsList.forEach(st => {
      if (st.userId?._id) {
        studentByUserIdMap[st.userId._id.toString()] = st;
      }
    });

    const interviews = await Interview.find()
      .populate({ 
        path: 'studentId', 
        model: Student,
        select: 'userId collegeName', 
        populate: { 
          path: 'userId', 
          model: User, 
          select: 'name email gender' 
        } 
      })
      .populate({ path: 'candidateId', model: User, select: 'name email gender' })
      .populate({ path: 'companyId', model: Company, select: 'companyName' })
      .populate({ path: 'driveId', model: RecruitmentDrive, select: 'jobRole' })
      .populate({ path: 'jobId', model: Job, select: 'title role' })
      .sort({ createdAt: -1 })
      .lean();

    const formattedInterviews = interviews.map(inv => {
      let studentName = 'Unknown';
      let collegeName = 'Unknown';
      let gender = 'Not Specified';
      let email = '';

      if (inv.studentId) {
        studentName = inv.studentId.userId?.name || 'Unknown';
        collegeName = inv.studentId.collegeName || 'Unknown';
        gender = inv.studentId.userId?.gender || 'Not Specified';
        email = inv.studentId.userId?.email || '';
      } else if (inv.candidateId) {
        const candidateIdStr = inv.candidateId._id?.toString() || inv.candidateId.toString();
        const studentProfile = studentByUserIdMap[candidateIdStr];
        studentName = inv.candidateId.name || studentProfile?.userId?.name || 'Unknown';
        collegeName = studentProfile?.collegeName || 'Unknown';
        gender = inv.candidateId.gender || studentProfile?.userId?.gender || 'Not Specified';
        email = inv.candidateId.email || studentProfile?.userId?.email || '';
      }

      return {
        ...inv,
        studentName,
        collegeName,
        gender,
        email,
        jobRole: inv.driveId?.jobRole || inv.jobId?.title || inv.jobId?.role || 'N/A',
        type: inv.type || inv.interviewRound || 'N/A',
        date: inv.date || inv.interviewDate,
        startTime: inv.startTime || inv.interviewTime,
      };
    });

    return NextResponse.json({ success: true, interviews: formattedInterviews });
  } catch (error) {
    console.error('Fetch Admin Interviews Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
