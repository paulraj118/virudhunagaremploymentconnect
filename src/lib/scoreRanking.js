import JobApplication from '@/models/JobApplication';
import AssessmentResult from '@/models/AssessmentResult';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import Student from '@/models/Student';
import Job from '@/models/Job';
import dbConnect from './mongodb';

/**
 * Calculates scores, updates them on JobApplication, and updates ranks for all candidates for this job.
 */
export async function calculateAndSyncOverallScore(applicationId) {
  await dbConnect();

  const jobApp = await JobApplication.findById(applicationId);
  if (!jobApp) return null;

  let assessmentScoreVal = 0;
  let technicalScoreVal = 0;

  const student = await Student.findById(jobApp.studentId);

  // 1. Assessment Score
  if (jobApp.studentId) {
    const assessmentResult = await AssessmentResult.findOne({ studentId: jobApp.studentId });
    if (assessmentResult) {
      assessmentScoreVal = assessmentResult.score || 0;
    }
  }

  // 2. Technical Score
  if (jobApp.technicalTestId && student) {
    const technicalAttempt = await TechnicalAttempt.findOne({
      technicalTestId: jobApp.technicalTestId,
      candidateId: student.userId,
      status: 'Completed'
    });
    if (technicalAttempt) {
      technicalScoreVal = technicalAttempt.scores?.totalScore || 0;
    }
  }

  // 3. Overall calculation
  const interviewScoreVal = jobApp.interviewScore || 0;
  const overallRecruitmentScore = assessmentScoreVal + technicalScoreVal + interviewScoreVal;
  // Percentage calculated out of 170 maximum marks (100 assessment + 20 technical + 50 interview)
  const percentage = Math.round((overallRecruitmentScore / 170) * 10000) / 100;

  jobApp.assessmentScore = assessmentScoreVal;
  jobApp.technicalScore = technicalScoreVal;
  jobApp.overallRecruitmentScore = overallRecruitmentScore;
  jobApp.percentage = percentage;
  await jobApp.save();

  // 4. Update Rankings for this job
  const allApps = await JobApplication.find({ jobId: jobApp.jobId }).sort({ overallRecruitmentScore: -1 });
  for (let i = 0; i < allApps.length; i++) {
    allApps[i].finalRank = i + 1;
    await allApps[i].save();
  }

  // Fetch updated jobApp to return correct rank
  const updatedJobApp = await JobApplication.findById(applicationId);

  return {
    assessmentScore: assessmentScoreVal,
    technicalScore: technicalScoreVal,
    interviewScore: interviewScoreVal,
    overallRecruitmentScore,
    percentage,
    finalRank: updatedJobApp.finalRank
  };
}
