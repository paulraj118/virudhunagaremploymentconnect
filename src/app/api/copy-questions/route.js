import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const uri = 'mongodb+srv://paulraj112003_db_user:Paulraj%402003@cluster0.lvxmi1c.mongodb.net/test?retryWrites=true&w=majority';
    
    console.log('Connecting to paulraj database...');
    const conn = await mongoose.createConnection(uri).asPromise();
    
    const oldSchema = new mongoose.Schema({}, { strict: false, collection: 'selfassessmentquestions' });
    const newSchema = new mongoose.Schema({}, { strict: false, collection: 'questions' });
    
    const SQ = conn.model('SQ', oldSchema);
    const Q = conn.model('Q', newSchema);

    console.log('Fetching questions from selfassessmentquestions...');
    const questions = await SQ.find({}).lean();
    
    if (questions.length === 0) {
      await conn.close();
      return NextResponse.json({ success: true, message: 'No questions found in selfassessmentquestions.' });
    }

    console.log('Clearing old data in questions collection...');
    await Q.deleteMany({});

    // Map the questions. The Question model has category which we map to domain.
    const docs = questions.map(q => {
      const { _id, ...rest } = q;
      // The centralized Question Bank API searches by category or domain,
      // but let's make sure it has 'category' just in case.
      rest.category = q.domain;
      return rest;
    });

    console.log('Inserting into questions collection...');
    const batchSize = 1000;
    let totalInserted = 0;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      await Q.insertMany(batch);
      totalInserted += batch.length;
    }

    await conn.close();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully copied ${totalInserted} questions to 'questions' collection inside paulraj database!` 
    });

  } catch (error) {
    console.error('Copy Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
