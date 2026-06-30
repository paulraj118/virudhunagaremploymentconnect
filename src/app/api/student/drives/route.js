import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentDrive from '@/models/RecruitmentDrive';
import Student from '@/models/Student';
import User from '@/models/User';
import DriveApplication from '@/models/DriveApplication';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const student = await Student.findOne({ userId: decoded.id }).lean();
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    const user = await User.findById(decoded.id).lean();

    // Calculate Employability Score
    const latestAssessment = await SelfAssessmentResult.findOne({ studentId: student._id, status: 'completed' }).sort({ completionDate: -1 }).lean();
    
    let employabilityScore = 0;
    let assessmentScore = 0;
    
    if (latestAssessment) {
      assessmentScore = latestAssessment.percentage || 0;
      let readiness = 5;
      if (assessmentScore >= 85) readiness = 20;
      else if (assessmentScore >= 70) readiness = 15;
      else if (assessmentScore >= 50) readiness = 10;

      const domainScore = latestAssessment.preferredDomain === student.preferredDomain ? 15 : 0;
      const trackScore = latestAssessment.industryTrack === student.industryTrack ? 10 : 0;
      
      let profileScore = 0;
      if (user.name) profileScore += 1;
      if (user.email) profileScore += 1;
      if (user.mobile) profileScore += 1;
      if (student.degree) profileScore += 1;
      if (student.department) profileScore += 1;
      if (student.skills && student.skills.length > 0) profileScore += 2;
      if (student.resumeUrl) profileScore += 1;
      if (student.preferredDomain) profileScore += 1;
      if (student.industryTrack) profileScore += 1;

      employabilityScore = (assessmentScore * 0.40) + readiness + domainScore + trackScore + profileScore + 5;
    }

    const drives = await RecruitmentDrive.find({ status: 'Published' }).lean();
    const applications = await DriveApplication.find({ studentId: student._id }).lean();
    const appliedDriveIds = applications.map(a => a.driveId.toString());

    // Filter Eligible Drives
    const eligibleDrives = drives.filter(drive => {
      if (drive.minAssessmentScore && assessmentScore < drive.minAssessmentScore) return false;
      if (drive.minEmployabilityScore && employabilityScore < drive.minEmployabilityScore) return false;
      
      if (drive.preferredDomains && drive.preferredDomains.length > 0) {
        if (!drive.preferredDomains.includes(student.preferredDomain)) return false;
      }
      if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0) {
        if (!drive.eligibleDepartments.includes(student.department)) return false;
      }
      if (drive.eligibleDegrees && drive.eligibleDegrees.length > 0) {
        if (!drive.eligibleDegrees.includes(student.degree)) return false;
      }
      
      if (drive.minCgpa != null) {
        if ((student.cgpa || 0) < drive.minCgpa) return false;
      }
      if (drive.maxActiveArrears != null) {
        if ((student.activeArrears || 0) > drive.maxActiveArrears) return false;
      }
      if (drive.passingYear != null) {
        if (student.yearOfPassedOut !== drive.passingYear) return false;
      }
      
      return true;
    }).map(drive => {
      const app = applications.find(a => a.driveId.toString() === drive._id.toString());
      return {
        ...drive,
        isApplied: !!app,
        applicationStatus: app ? app.status : null
      };
    });

    return NextResponse.json({ success: true, eligibleDrives });
  } catch (error) {
    console.error('Fetch Student Drives Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
