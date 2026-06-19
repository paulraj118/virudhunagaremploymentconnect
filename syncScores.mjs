import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobfair_pro";

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Find all assessment results
    const assessments = await db.collection('assessmentresults').find().toArray();
    for (const assessment of assessments) {
      if (assessment.studentId) {
        // update the corresponding student document
        await db.collection('students').updateOne(
          { _id: assessment.studentId },
          { $set: { assessmentScore: assessment.percentage } }
        );
        console.log(`Updated student ${assessment.studentId} with score ${assessment.percentage}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
