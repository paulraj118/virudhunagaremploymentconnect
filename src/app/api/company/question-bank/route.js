import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import QuestionBankAuditLog from '@/models/QuestionBankAuditLog';
import dbConnect from '@/lib/mongodb';

function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET - List questions with search, filters, pagination
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    let query = { isDeleted: false };
    
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
      
      // HR sees their company's questions and global admin questions
      query.$or = [{ companyId: company._id }, { companyId: null }];
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const jobRole = searchParams.get('jobRole');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const language = searchParams.get('language');
    const status = searchParams.get('status');
    const domain = searchParams.get('domain');
    const source = searchParams.get('source');
    const approved = searchParams.get('approved');

    if (search) {
      query.$text = { $search: search };
    }
    if (jobRole) query.jobRole = jobRole;
    if (category) query.category = category;
    if (type) query.type = type;
    if (language) query.language = language;
    if (status) query.status = status;
    if (domain) query.domain = domain;
    if (source) query.source = source;
    if (approved === 'true') query.approved = true;
    if (approved === 'false') query.approved = false;

    const questions = await QuestionBank.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Fetch Question Bank Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new question or save AI generated question
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let companyId = null;
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
      companyId = company._id;
    }

    const body = await request.json();
    
    // Duplicate Detection Logic
    let duplicateQuery = {
      isDeleted: false,
      type: body.type,
    };
    
    // HR checks within their company and global. Admin checks global.
    if (companyId) {
      duplicateQuery.$or = [{ companyId: companyId }, { companyId: null }];
    } else {
      duplicateQuery.companyId = null;
    }

    let isDuplicate = false;

    if (body.type === 'MCQ' || body.type === 'FILL_BLANK') {
       const norm = normalizeText(body.content.questionText);
       const list = await QuestionBank.find(duplicateQuery);
       for (const q of list) {
         if (normalizeText(q.content?.questionText) === norm) {
           isDuplicate = true;
           break;
         }
       }
    } else if (body.type === 'PROGRAMMING') {
       duplicateQuery['content.title'] = { $regex: new RegExp(`^${escapeRegExp(body.content.title)}$`, 'i') };
       const existing = await QuestionBank.findOne(duplicateQuery);
       if (existing) isDuplicate = true;
    }

    if (isDuplicate) {
      return NextResponse.json({ success: false, message: 'Duplicate question detected.' }, { status: 409 });
    }

    const newQuestion = await QuestionBank.create({
      ...body,
      companyId,
      createdBy: decoded.id,
      versionHistory: [{
        version: 1,
        previousContent: null,
        editedBy: decoded.id,
        editedAt: new Date()
      }]
    });

    await QuestionBankAuditLog.create({
      action: 'Created',
      questionId: newQuestion._id,
      companyId,
      userId: decoded.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      details: { initialStatus: body.status }
    });

    return NextResponse.json({ success: true, message: 'Question added successfully', question: newQuestion });

  } catch (error) {
    console.error('Create Question Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
