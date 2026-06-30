import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { questions } = await request.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ success: false, message: 'Invalid data format. Expected an array of questions.' }, { status: 400 });
    }

    // Validate and build bulk ops
    const bulkOps = [];
    let invalidCount = 0;

    for (const data of questions) {
      if (!data.domain || !data.level || !data.topic || !data.questionText || !data.options || data.options.length !== 4 || data.correctOptionIndex === undefined || !data.explanation) {
        invalidCount++;
        continue; // skip incomplete
      }

      // Default difficulty if not provided
      if(!data.difficulty) {
        if(data.level === 'low') data.difficulty = 'Easy';
        else if (data.level === 'medium') data.difficulty = 'Medium';
        else data.difficulty = 'Hard';
      }

      // Upsert: Skip if exists, otherwise insert
      bulkOps.push({
        updateOne: {
          filter: { 
            domain: data.domain, 
            level: data.level, 
            questionText: data.questionText 
          },
          update: { $setOnInsert: data },
          upsert: true
        }
      });
    }

    if (bulkOps.length === 0 && invalidCount > 0) {
      return NextResponse.json({ success: false, message: `All ${invalidCount} records were invalid and rejected.` }, { status: 400 });
    } else if (bulkOps.length === 0) {
      return NextResponse.json({ success: false, message: 'No records to process.' }, { status: 400 });
    }

    const result = await SelfAssessmentQuestion.bulkWrite(bulkOps, { ordered: false });

    return NextResponse.json({ 
      success: true, 
      message: 'Bulk import processed', 
      stats: {
        processed: bulkOps.length,
        inserted: result.upsertedCount,
        skippedDuplicates: bulkOps.length - result.upsertedCount,
        rejectedInvalid: invalidCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
