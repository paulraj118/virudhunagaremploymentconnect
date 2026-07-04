import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';

export async function GET(request) {
  try {
    // Connect to the NEW database
    await dbConnect();

    // Connect to the OLD database
    const oldUri = 'mongodb://sprofileview_db_user:tu4QH0myyZu3fe3C@ac-svs7our-shard-00-00.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-01.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-02.yhdfaab.mongodb.net:27017/jobfair_virudhunagar?authSource=admin&replicaSet=atlas-nbcn94-shard-0&ssl=true&retryWrites=true&w=majority';
    const oldConn = await mongoose.createConnection(oldUri).asPromise();
    
    // Schema for OLD database
    const oldSchema = new mongoose.Schema({}, { strict: false, collection: 'selfassessmentquestions' });
    const OldQuestion = oldConn.model('OldQuestion', oldSchema);

    // Fetch questions from OLD database
    const questions = await OldQuestion.find({}).lean();
    
    if (questions.length === 0) {
      await oldConn.close();
      return NextResponse.json({ success: true, message: 'No questions found in old database.' });
    }

    // Optional: clear the current ones to avoid duplicates
    await SelfAssessmentQuestion.deleteMany({});

    // Clean up IDs to let the new database generate new ObjectIDs, or keep them. 
    // Usually, keeping them is fine unless there's a conflict.
    // Let's strip the _id so they get freshly inserted.
    const cleanQuestions = questions.map(q => {
      const { _id, ...rest } = q;
      return rest;
    });

    // Insert into NEW database in chunks of 1000
    const batchSize = 1000;
    let totalInserted = 0;
    for (let i = 0; i < cleanQuestions.length; i += batchSize) {
      const batch = cleanQuestions.slice(i, i + batchSize);
      await SelfAssessmentQuestion.insertMany(batch);
      totalInserted += batch.length;
    }

    await oldConn.close();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${totalInserted} questions to the new database!` 
    });

  } catch (error) {
    console.error('Migration Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
