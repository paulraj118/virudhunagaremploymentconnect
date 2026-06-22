import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobfair_pro";

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log("Fetching users...");
    const users = await db.collection('users').find({}).toArray();
    for (const u of users) {
      console.log(`User: ${u.email}, ID: ${u._id}, Role: ${u.role}`);
    }

    console.log("\nFetching companies...");
    const companies = await db.collection('companies').find({}).toArray();
    for (const c of companies) {
      console.log(`Company: ${c.companyName}, UserID: ${c.userId}, Status: ${c.approvalStatus}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
