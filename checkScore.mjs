import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobfair_pro";

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const students = await db.collection('students').find().toArray();
    console.log(JSON.stringify(students, null, 2));
    
    const assessments = await db.collection('assessmentresults').find().toArray();
    console.log(JSON.stringify(assessments, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
