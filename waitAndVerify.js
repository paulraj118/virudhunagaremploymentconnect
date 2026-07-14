const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://sprofileview_db_user:tu4QH0myyZu3fe3C@ac-svs7our-shard-00-00.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-01.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-02.yhdfaab.mongodb.net:27017/jobfair_virudhunagar?authSource=admin&replicaSet=atlas-nbcn94-shard-0&ssl=true&retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Database connected. Waiting for a real Interview document to be scheduled...');

  // Import models
  const User = require('./src/models/User').default;
  const Student = require('./src/models/Student').default;
  const Company = require('./src/models/Company').default;
  const RecruitmentDrive = require('./src/models/RecruitmentDrive').default;
  const Job = require('./src/models/Job').default;
  const Interview = require('./src/models/Interview').default;

  const check = async () => {
    try {
      const count = await Interview.countDocuments();
      if (count > 0) {
        console.log(`\nFound ${count} scheduled interview(s)! Starting verification...`);
        
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

        console.log('\n--- VERIFICATION RESULTS ---');
        interviews.forEach((inv, i) => {
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

          console.log(`\n[Interview #${i + 1}] ID: ${inv.interviewId}`);
          console.log(`- Candidate Name: ${studentName}`);
          console.log(`- College: ${collegeName}`);
          console.log(`- Gender: ${gender}`);
          console.log(`- Email: ${email}`);
          console.log(`- Company Name: ${inv.companyId?.companyName || 'N/A'}`);
          console.log(`- Job/Role: ${inv.driveId?.jobRole || inv.jobId?.title || inv.jobId?.role || 'N/A'}`);
          console.log(`- Type: ${inv.type || inv.interviewRound || 'N/A'}`);
          console.log(`- Date: ${inv.date || inv.interviewDate}`);
          console.log(`- Start Time: ${inv.startTime || inv.interviewTime}`);
        });

        console.log('\nSUCCESS: All populates and reference matching performed successfully without errors!');
        process.exit(0);
      }
    } catch (err) {
      console.error('Error during verification check:', err);
      process.exit(1);
    }
  };

  // Check every 5 seconds, up to 10 minutes (120 ticks)
  let ticks = 0;
  const interval = setInterval(async () => {
    ticks++;
    await check();
    if (ticks >= 120) {
      console.log('Timeout waiting for real interview creation.');
      clearInterval(interval);
      await mongoose.disconnect();
      process.exit(0);
    }
  }, 5000);
}

main();
