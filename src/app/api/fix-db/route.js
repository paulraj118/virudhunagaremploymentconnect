import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuestionBank from '@/models/QuestionBank';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Attempt to drop the existing text index which has the language override issue
    try {
      await QuestionBank.collection.dropIndex('content.questionText_text_content.problemStatement_text_tags_text');
      console.log('Old text index dropped');
    } catch (e) {
      console.log('Index might not exist or already dropped', e.message);
    }

    // Attempt to drop any generic text index
    try {
      await QuestionBank.collection.dropIndex('$**_text');
    } catch (e) {}

    // Force mongoose to rebuild all indexes for QuestionBank
    await QuestionBank.syncIndexes();

    return NextResponse.json({ success: true, message: 'Indexes synced successfully!' });
  } catch (error) {
    console.error('Fix DB Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
