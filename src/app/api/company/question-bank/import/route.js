import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import dbConnect from '@/lib/mongodb';

function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let companyId = null;
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
      companyId = company._id;
    }

    const contentType = request.headers.get('content-type') || '';
    let questions = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      questions = body.questions || body;
      if (!Array.isArray(questions)) {
        return NextResponse.json({ success: false, message: 'Expected an array of questions' }, { status: 400 });
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      const text = await file.text();
      const fileName = file.name || '';

      if (fileName.endsWith('.json')) {
        const parsed = JSON.parse(text);
        questions = parsed.questions || parsed;
        if (!Array.isArray(questions)) {
          return NextResponse.json({ success: false, message: 'JSON must contain an array of questions' }, { status: 400 });
        }
      } else if (fileName.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          return NextResponse.json({ success: false, message: 'CSV file has no data rows' }, { status: 400 });
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
          const row = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

          questions.push({
            domain: row.domain || '',
            type: (row.type || 'MCQ').toUpperCase(),
            question: row.question || '',
            correctAnswer: row['correct answer'] || row.correctanswer || row.answer || '',
            explanation: row.explanation || '',
            topic: row.topic || '',
            options: row.options ? row.options.split('|') : []
          });
        }
      } else {
        return NextResponse.json({ success: false, message: 'Unsupported file format. Use .json or .csv' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, message: 'Unsupported content type' }, { status: 400 });
    }

    let imported = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    for (const q of questions) {
      try {
        // Determine type
        let qType = (q.type || q.questionType || 'MCQ').toUpperCase();
        if (qType === 'FILL_IN_THE_BLANK' || qType === 'FILL IN THE BLANK' || qType === 'FILL_BLANK') qType = 'FILL_BLANK';
        if (qType === 'PROGRAMMING' || qType === 'PROGRAM') qType = 'PROGRAMMING';
        if (!['MCQ', 'FILL_BLANK', 'PROGRAMMING'].includes(qType)) qType = 'MCQ';

        // Check duplicate
        const baseQuery = { isDeleted: false };
        if (companyId) {
          baseQuery.$or = [{ companyId }, { companyId: null }];
        }

        let isDuplicate = false;
        const questionText = q.question || q.questionText || '';

        if (qType === 'MCQ' || qType === 'FILL_BLANK') {
          const norm = normalizeText(questionText);
          if (norm) {
            const candidates = await QuestionBank.find({ ...baseQuery, type: qType }).select('content.questionText').lean();
            for (const c of candidates) {
              if (normalizeText(c.content?.questionText) === norm) {
                isDuplicate = true;
                break;
              }
            }
          }
        } else if (qType === 'PROGRAMMING') {
          const title = q.question || q.title || '';
          if (title) {
            const existing = await QuestionBank.findOne({
              ...baseQuery,
              type: 'PROGRAMMING',
              'content.title': { $regex: new RegExp(`^${escapeRegExp(title.trim())}$`, 'i') }
            });
            if (existing) isDuplicate = true;
          }
        }

        if (isDuplicate) {
          duplicatesSkipped++;
          continue;
        }

        // Build document
        const doc = {
          companyId,
          jobRole: q.domain || q.jobRole || 'General',
          category: 'Technical',
          type: qType,
          tags: [q.domain || '', q.topic || ''].filter(Boolean),
          domain: q.domain || '',
          topic: q.topic || '',
          source: 'Manual',
          approved: true,
          status: 'Approved',
          isAiGenerated: false,
          usageCount: 0,
          lastUsedAt: null,
          createdBy: decoded.id,
          marks: qType === 'PROGRAMMING' ? 5 : 1,
          content: {},
          versionHistory: [{
            version: 1,
            previousContent: null,
            editedBy: decoded.id,
            editedAt: new Date()
          }]
        };

        if (qType === 'MCQ') {
          doc.content = {
            questionText: questionText,
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || ''
          };
        } else if (qType === 'FILL_BLANK') {
          doc.content = {
            questionText: questionText,
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || ''
          };
        } else if (qType === 'PROGRAMMING') {
          doc.content = {
            title: q.question || q.title || '',
            problemStatement: q.problemStatement || q.description || '',
            inputFormat: q.inputFormat || '',
            outputFormat: q.outputFormat || '',
            constraints: q.constraints || '',
            sampleInput: q.sampleInput || '',
            sampleOutput: q.sampleOutput || '',
            hiddenTestCases: q.hiddenTestCases || [],
            starterCode: q.starterCode || ''
          };
        }

        await QuestionBank.create(doc);
        imported++;
      } catch (err) {
        console.error('Import question error:', err.message);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: questions.length,
        imported,
        duplicatesSkipped,
        errors
      }
    });

  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: 500 });
  }
}
