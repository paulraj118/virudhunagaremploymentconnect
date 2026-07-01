import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import dbConnect from '@/lib/mongodb';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let matchQuery = { isDeleted: false };

    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
      matchQuery.$or = [{ companyId: company._id }, { companyId: null }];
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const domain = searchParams.get('domain');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    if (domain) matchQuery.domain = domain;
    if (type) matchQuery.type = type;
    if (status) matchQuery.status = status;
    if (source === 'AI') matchQuery.source = 'AI';
    if (source === 'Manual') matchQuery.source = 'Manual';

    const questions = await QuestionBank.find(matchQuery).sort({ createdAt: -1 }).lean();

    if (format === 'csv') {
      const csvRows = ['Domain,Type,Question,Correct Answer,Explanation,Topic,Status,Source'];
      for (const q of questions) {
        const questionText = q.type === 'PROGRAMMING'
          ? (q.content?.title || '').replace(/,/g, ';')
          : (q.content?.questionText || '').replace(/,/g, ';');
        const correctAnswer = (q.content?.correctAnswer || '').replace(/,/g, ';');
        const explanation = (q.content?.explanation || '').replace(/,/g, ';');
        csvRows.push(`"${q.domain || ''}","${q.type}","${questionText}","${correctAnswer}","${explanation}","${q.topic || ''}","${q.status}","${q.source || ''}"`);
      }

      return new Response(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="question-bank-${Date.now()}.csv"`
        }
      });
    }

    if (format === 'pdf') {
      // Generate simple HTML-based printable PDF content
      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Question Bank Export</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        h1 { font-size: 18px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
      </style></head><body>
      <h1>Question Bank Export - ${questions.length} Questions</h1>
      <table>
        <thead><tr><th>#</th><th>Domain</th><th>Type</th><th>Question</th><th>Answer</th><th>Status</th></tr></thead>
        <tbody>`;

      questions.forEach((q, i) => {
        const qText = q.type === 'PROGRAMMING' ? (q.content?.title || '') : (q.content?.questionText || '');
        const ans = q.content?.correctAnswer || '';
        html += `<tr><td>${i + 1}</td><td>${q.domain || ''}</td><td>${q.type}</td><td>${qText}</td><td>${ans}</td><td>${q.status}</td></tr>`;
      });

      html += '</tbody></table></body></html>';

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="question-bank-${Date.now()}.html"`
        }
      });
    }

    // Default: JSON
    return new Response(JSON.stringify(questions, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="question-bank-${Date.now()}.json"`
      }
    });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
