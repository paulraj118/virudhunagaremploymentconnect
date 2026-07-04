import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const oldUri = 'mongodb://sprofileview_db_user:tu4QH0myyZu3fe3C@ac-svs7our-shard-00-00.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-01.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-02.yhdfaab.mongodb.net:27017/jobfair_virudhunagar?authSource=admin&replicaSet=atlas-nbcn94-shard-0&ssl=true&retryWrites=true&w=majority';
    const newUri = 'mongodb+srv://paulraj112003_db_user:Paulraj%402003@cluster0.lvxmi1c.mongodb.net/test?retryWrites=true&w=majority';

    console.log('Connecting to OLD database...');
    const oldConn = await mongoose.createConnection(oldUri).asPromise();
    
    console.log('Connecting to NEW database...');
    const newConn = await mongoose.createConnection(newUri).asPromise();
    
    const schema = new mongoose.Schema({}, { strict: false, collection: 'selfassessmentquestions' });
    const OldQuestion = oldConn.model('OldQuestion', schema);
    const NewQuestion = newConn.model('NewQuestion', schema);

    console.log('Fetching questions from old database...');
    const questions = await OldQuestion.find({}).lean();
    
    if (questions.length === 0) {
      await oldConn.close();
      await newConn.close();
      return NextResponse.json({ success: true, message: 'No questions found in old database.' });
    }

    console.log('Clearing old data in new DB...');
    await NewQuestion.deleteMany({});

    const cleanQuestions = questions.map(q => {
      const { _id, ...rest } = q;
      return rest;
    });

    console.log('Inserting into NEW database...');
    const batchSize = 1000;
    let totalInserted = 0;
    for (let i = 0; i < cleanQuestions.length; i += batchSize) {
      const batch = cleanQuestions.slice(i, i + batchSize);
      await NewQuestion.insertMany(batch);
      totalInserted += batch.length;
    }

    await oldConn.close();
    await newConn.close();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${totalInserted} questions directly to paulraj112003 database!` 
    });

  } catch (error) {
    console.error('Migration Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
